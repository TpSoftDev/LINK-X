import os
import uuid
import tempfile
import pickle
import faiss
import numpy as np
import tempfile
import shutil
import json
from datetime import datetime
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import firebase_admin
from firebase_admin import auth, credentials
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from src.db.schema import Base
from openai import OpenAI
from transcriber import transcribe_audio
from indexer import rebuild_course_index, rebuild_file_index, store_file_embeddings
from io import BytesIO
from src.textUtils import openai_embed_text

from src.db.queries import (
    # User & Role
    get_access_code_by_course, get_access_code_by_id, get_course_title, get_enrollment, get_file_metrics_for_course, get_files_without_raw_by_module, get_module_metrics_for_course, get_report_by_course, get_student_questions_for_course, get_user_by_id, get_user_by_email, get_user_by_firebase_uid,
    create_user, update_user, delete_user,
    get_role_by_user_id, set_role,
    # Profiles
    get_instructor_profile, create_instructor_profile, update_instructor_profile, delete_instructor_profile,
    get_student_profile, create_student_profile, update_student_profile, delete_student_profile,
    get_admin_profile, create_admin_profile, update_admin_profile, delete_admin_profile,
    # Domain
    get_course_by_id, get_courses_by_instructor_id, get_courses_by_student_id, create_course, update_course, delete_course,
    get_module_by_id, get_modules_by_course, create_module, update_module, delete_module,
    get_file_by_id, get_files_by_module, create_file, update_file, delete_file,
    get_access_code_by_code, create_access_code, delete_access_code,
    get_enrollment_by_student_course, create_enrollment, delete_enrollment, get_enrollments_by_student,
    get_personalized_file_by_id, get_personalized_files_by_student, create_personalized_file,
    update_personalized_file, delete_personalized_file,
    get_chat_by_id, get_chats_by_student, create_chat, update_chat, delete_chat,
    get_message_by_id, get_messages_by_chat, create_message, delete_messages_after,
    get_report_by_id, create_report, update_report, delete_report
)

from src.prompts import (
    prompt1_create_course,
    prompt2_generate_course_outline, prompt2_generate_course_outline_RAG,
    prompt3_generate_module_content, prompt3_generate_module_content_RAG, 
    prompt4_valid_query,
    prompt_course_faqs,
    prompt_generate_personalized_file_content
)

from FAISS_db_generation import create_database, generate_citations, replace_sources, file_cleanup

load_dotenv()
app = Flask(__name__)
CORS(app, supports_credentials=True)

app.config['TESTING'] = False

cred = credentials.Certificate(os.getenv("FIREBASE_KEY_PATH", "firebaseKey.json"))
firebase_admin.initialize_app(cred)

POSTGRES_URL = os.getenv("POSTGRES_URL")
if not POSTGRES_URL:
    raise RuntimeError("POSTGRES_URL not set")
engine = create_engine(POSTGRES_URL)
Session = sessionmaker(bind=engine, expire_on_commit=False)
Base.metadata.create_all(engine)

def get_user_session():
    token = request.cookies.get('session')
    if not token:
        return {'error': 'Missing session cookie'}
    try:
        return auth.verify_session_cookie(token, check_revoked=True)
    except Exception as e:
        return {'error': str(e)}


def verify_role(required_role):
    session = get_user_session()
    if 'error' in session:
        return None, (jsonify(session), 401)

    firebase_uid = session['uid']

    db = Session()
    user = get_user_by_firebase_uid(db, firebase_uid)
    if not user:
        db.close()
        return None, (jsonify({'error': 'User not found'}), 404)

    role = get_role_by_user_id(db, user.id) 
    db.close()

    if not role or role.role_type != required_role:
        return None, (jsonify({'error': 'Forbidden'}), 403)

    return user.id, None


def verify_admin():    return verify_role('admin')
def verify_instructor(): return verify_role('instructor')
def verify_student():   return verify_role('student')


@app.route('/me', methods=['GET'])
def me_get():
    session = get_user_session()
    if 'error' in session:
        return jsonify(session), 401

    firebase_uid = session['uid']
    db = Session()
    user = get_user_by_firebase_uid(db, firebase_uid)
    role = get_role_by_user_id(db, user.id)
    profile_data = None
    if role.role_type == 'instructor':
        prof = get_instructor_profile(db, user.id)
        if prof:
            profile_data = {
                'user_id':     str(prof.user_id),
                'name':        prof.name,
                'university':  prof.university
            }
    elif role.role_type == 'student':
        prof = get_student_profile(db, user.id)
        if prof:
            profile_data = {
                'user_id':          str(prof.user_id),
                'name':             prof.name,
                'onboard_answers':  prof.onboard_answers,
                'want_quizzes':     prof.want_quizzes,
                'model_preference': prof.model_preference
            }
    elif role.role_type == 'admin':
        prof = get_admin_profile(db, user.id)
        if prof:
            profile_data = {
                'user_id': str(prof.user_id),
                'name':    prof.name
            }

    db.close()

    return jsonify({
        'id':      str(user.id),
        'email':   user.email,
        'role':    role.role_type,
        'profile': profile_data
    }), 200


@app.route('/me', methods=['PATCH'])
def me_patch():
    session = get_user_session()
    if 'error' in session:
        return jsonify(session), 401

    firebase_uid = session['uid']
    data = request.get_json() or {}

    db = Session()
    user = get_user_by_firebase_uid(db, firebase_uid)
    if not user:
        db.close()
        return jsonify({'error': 'User not found'}), 404

    if 'email' in data:
        user.email = data['email']
    if 'password' in data:
        user.password = data['password']

    role = get_role_by_user_id(db, user.id)
    if role.role_type == 'student':
        prof = get_student_profile(db, user.id)
        if prof:
            if 'name' in data:
                prof.name = data['name']
            if 'onboard_answers' in data:
                prof.onboard_answers = data['onboard_answers']
            if 'want_quizzes' in data:
                prof.want_quizzes = data['want_quizzes']
            if 'model_preference' in data:
                prof.model_preference = data['model_preference']

    elif role.role_type == 'instructor':
        prof = get_instructor_profile(db, user.id)
        if prof:
            if 'name' in data:
                prof.name = data['name']
            if 'university' in data:
                prof.university = data['university']

    elif role.role_type == 'admin':
        prof = get_admin_profile(db, user.id)
        if prof and 'name' in data:
            prof.name = data['name']

    db.commit()
    db.refresh(user)
    response = {
        'id':    str(user.id),
        'email': user.email,
        'role':  role.role_type,
    }
    db.close()
    return jsonify(response), 200

@app.route('/me', methods=['DELETE'])
def me_delete():
    session = get_user_session()
    if 'error' in session:
        return jsonify(session), 401

    firebase_uid = session['uid']

    db = Session()
    user = get_user_by_firebase_uid(db, firebase_uid)
    if not user:
        db.close()
        return jsonify({'error': 'User not found'}), 404

    db.delete(user)
    db.commit()
    db.close()

    resp = jsonify({'message': 'Account deleted'})
    resp.set_cookie('session', '', max_age=0, httponly=True, samesite='Lax')
    return resp, 200

@app.route('/register/instructor', methods=['POST'])
def register_instructor():
    data = request.get_json() or {}
    id_token = data.get('idToken')
    if not id_token:
        return jsonify({'error':'Missing ID token'}), 400
    try:
        decoded = auth.verify_id_token(id_token)
        firebase_uid = decoded['uid']
    except Exception as e:
        return jsonify({'error': f'Invalid ID token: {e}'}), 401

    email = data.get('email')
    pwd   = data.get('password')
    name = data.get("name")
    university = data.get("university")

    if not email or not pwd or not name:
        return jsonify({'error':'Email, password, and name required'}), 400

    db = Session()
    user = create_user(db, email, pwd, firebase_uid, 'instructor')
    create_instructor_profile(db, user.id, name, university)
    db.close()

    return jsonify({'id': str(user.id), 'email': user.email}), 201


@app.route('/register/student', methods=['POST'])
def register_student():
    data = request.get_json() or {}
    id_token = data.get('idToken')
    if not id_token:
        return jsonify({'error':'Missing ID token'}), 400
    try:
        decoded = auth.verify_id_token(id_token)
        firebase_uid = decoded['uid']
    except Exception as e:
        return jsonify({'error': f'Invalid ID token: {e}'}), 401

    email = data.get('email')
    pwd   = data.get('password')
    if not email or not pwd:
        return jsonify({'error':'Email and password required'}), 400

    db = Session()
    user = create_user(db, email, pwd, firebase_uid, 'student')
    db.close()

    return jsonify({'id': str(user.id), 'email': user.email}), 201

@app.route('/instructor/profile', methods=['POST','GET','PATCH','DELETE'])
def instructor_profile():
    user_id, err = verify_instructor()
    if err:
        return err
    db = Session()

    if request.method == 'POST':
        data = request.get_json() or {}
        name       = data.get('name')
        university = data.get('university')
        if not name:
            db.close()
            return jsonify({'error':'Name required'}), 400

        prof = create_instructor_profile(db, user_id, name, university)
        db.close()

        out = {
            'user_id':  str(prof.user_id),
            'name':     prof.name,
            'university': prof.university
        }
        return jsonify(out), 201

    if request.method == 'GET':
        prof = get_instructor_profile(db, user_id)
        db.close()
        if not prof:
            return jsonify({'error':'Not found'}), 404

        out = {
            'user_id':  str(prof.user_id),
            'name':     prof.name,
            'university': prof.university
        }
        return jsonify(out), 200

    if request.method == 'PATCH':
        data = request.get_json() or {}
        updated = update_instructor_profile(db, user_id, **data)
        db.close()
        return jsonify({'user_id': str(updated.user_id)}), 200

    # DELETE
    delete_instructor_profile(db, user_id)
    delete_user(db, user_id)
    db.close()
    resp = jsonify({'message':'Instructor deleted'})
    resp.set_cookie('session','',max_age=0)
    return resp, 200

@app.route('/student/courses', methods=['GET'])
def student_courses():
    user_id, err = verify_student()
    if err:
        return err
    db = Session()
    courses = get_courses_by_student_id(db, user_id)
    db.close()
    return jsonify([
    {
        'id': str(c.id),
        'title': c.title,
        'description': c.description,
        'code': c.code,
        'term': c.term,
        'published': c.published,
        'last_updated': c.last_updated.isoformat() if c.last_updated else None
    }
    for c in courses
]), 200

@app.route('/instructor/courses', methods=['POST', 'GET'])
def instructor_courses():
    user_id, err = verify_instructor()
    if err: 
        return err
    db = Session()
    if request.method == 'POST':
        data = request.get_json() or {}
        title = data.get('title')
        description = data.get('description', '')
        code = data.get('code')          
        term = data.get('term')  
        published = data.get('published', False)        

    
        c = create_course(
            db,
            title=title,
            description=description,
            instructor_id=user_id,
            code=code,
            term=term,
            published=published,
        )

        access_code = uuid.uuid4().hex[:8]
        create_access_code(db, course_id=c.id, code=access_code)

        db.close()
        return jsonify({'id': str(c.id), 'accessCode': access_code}), 201

    # GET request
    courses = get_courses_by_instructor_id(db, user_id)
    db.close()
    return jsonify([
    {
        'id': str(c.id),
        'title': c.title,
        'description': c.description,
        'code': c.code,
        'term': c.term,
        'published': c.published,
        'last_updated': c.last_updated.isoformat() if c.last_updated else None
    }
    for c in courses
]), 200

@app.route('/instructor/courses/<course_id>', methods=['GET','PATCH','DELETE'])
def instructor_manage_course(course_id):
    user_id, err = verify_instructor()
    if err: return err
    db = Session()
    c = get_course_by_id(db, course_id)
    if not c or str(c.instructor_id)!=str(user_id):
        db.close(); return jsonify({'error':'Forbidden'}), 403
    if request.method == 'GET':
        out = {'id':str(c.id), 'title':c.title, 'description':c.description, 'created_at':c.created_at.isoformat()}
        db.close(); return jsonify(out), 200
    if request.method == 'PATCH':
        data = request.get_json() or {}
        updated = update_course(db, course_id, **data)
        db.close(); return jsonify({'id':str(updated.id)}), 200
    delete_course(db, course_id)
    db.close(); return jsonify({'message':'Deleted'}), 200

@app.route('/instructor/courses/<course_id>/accesscodes', methods=['POST','GET'])
def instructor_accesscodes(course_id):
    user_id, err = verify_instructor()
    if err: 
        return err

    db = Session()
    c = get_course_by_id(db, course_id)
    if not c or str(c.instructor_id) != str(user_id):
        db.close()
        return jsonify({'error':'Forbidden'}), 403

    if request.method == 'POST':
        code = uuid.uuid4().hex[:8]
        ac = create_access_code(db, course_id=course_id, code=code)
        db.close()
        return jsonify({'id':str(ac.id), 'code':ac.code}), 201

    acs = get_access_code_by_course(db, course_id)
    db.close()
    return jsonify([{'id':str(a.id),'code':a.code} for a in acs]), 200

@app.route('/instructor/accesscodes/<code_id>', methods=['DELETE'])
def instructor_delete_accesscode(code_id):
    user_id, err = verify_instructor()
    if err:
        return err
    db = Session()
    ac = get_access_code_by_id(db, code_id)
    if not ac:
        db.close()
        return jsonify({'error': 'Not found'}), 404
    course = get_course_by_id(db, ac.course_id)
    if str(course.instructor_id) != str(user_id):
        db.close()
        return jsonify({'error': 'Forbidden'}), 403
    delete_access_code(db, code_id)
    db.close()
    return jsonify({'message': 'Deleted'}), 200

@app.route('/instructor/courses/<course_id>/details', methods=['GET'])
def instructor_course_details(course_id):
    user_id, err = verify_instructor()
    if err:
        return err

    db = Session()
    course = get_course_by_id(db, course_id)
    if not course or str(course.instructor_id) != str(user_id):
        db.close()
        return jsonify({'error': 'Forbidden'}), 403

    # Fetch access code and enrollments
    access_codes = get_access_code_by_course(db, course_id)
    access_code = access_codes[0].code if access_codes else "N/A"
    students_enrolled = len(course.enrollments) if course.enrollments else 0

    db.close()
    return jsonify({
        'id': str(course.id),
        'title': course.title,
        'description': course.description,
        'code': course.code,
        'term': course.term,
        'published': course.published,
        'lastUpdated': course.last_updated.isoformat(),
        'accessCode': access_code,
        'students': students_enrolled
    }), 200


@app.route('/instructor/enrollments/<enrollment_id>', methods=['DELETE'])
def instructor_unenroll(enrollment_id):
    user_id, err = verify_instructor()
    if err:
        return err
    db = Session()
    e = get_enrollment(db, enrollment_id)
    if not e:
        db.close()
        return jsonify({'error': 'Enrollment not found'}), 404
    course = get_course_by_id(db, e.course_id)
    if str(course.instructor_id) != str(user_id):
        db.close()
        return jsonify({'error': 'Forbidden'}), 403
    delete_enrollment(db, e.user_id, e.course_id)
    db.close()
    return jsonify({'message': 'Student unenrolled'}), 200


@app.route('/instructor/courses/<course_id>/students', methods=['GET'])
def instructor_course_students(course_id):
    user_id, err = verify_instructor()
    if err:
        return err

    db = Session()
    course = get_course_by_id(db, course_id)
    if not course or str(course.instructor_id) != str(user_id):
        db.close()
        return jsonify({'error': 'Forbidden'}), 403

    enrollments = course.enrollments
    students = []
    for e in enrollments:
        student = get_user_by_id(db, e.user_id)
        profile = get_student_profile(db, e.user_id)
        students.append({
            'id': str(student.id),
            'email': student.email,
            'name': profile.name if profile else "Unknown",
            'enrolledAt': e.enrolled_at.isoformat(),
            'enrollmentId': str(e.id) 
        })

    db.close()
    return jsonify(students), 200



@app.route('/instructor/courses/<course_id>/modules', methods=['POST', 'GET'])
def instructor_modules(course_id):
    user_id, err = verify_instructor()
    if err:
        return err

    db = Session()
    course = get_course_by_id(db, course_id)

    if not course or str(course.instructor_id) != str(user_id):
        db.close()
        return jsonify({'error': 'Forbidden'}), 403

    if request.method == 'POST':
        data = request.get_json() or {}
        m = create_module(db, course_id, data['title'])
        db.close()
        return jsonify({'id': str(m.id), 'title': m.title}), 201

    mods = get_modules_by_course(db, course_id)
    db.close()

    # 🚨 Defensive fallback in case mods is None
    if not isinstance(mods, list):
        mods = []

    return jsonify([{'id': str(m.id), 'title': m.title} for m in mods]), 200



@app.route('/instructor/modules/<module_id>', methods=['GET', 'PATCH', 'DELETE'])
def instructor_manage_module(module_id):
    user_id, err = verify_instructor()
    if err:
        return err
    db = Session()
    m = get_module_by_id(db, module_id)
    if not m:
        db.close()
        return jsonify({'error': 'Not found'}), 404
    course = get_course_by_id(db, m.course_id)
    if str(course.instructor_id) != str(user_id):
        db.close()
        return jsonify({'error': 'Forbidden'}), 403
    if request.method == 'GET':
        out = {'id': str(m.id), 'title': m.title}
        db.close()
        return jsonify(out), 200
    if request.method == 'PATCH':
        data = request.get_json() or {}
        updated = update_module(db, module_id, **data)
        db.close()
        return jsonify({'id': str(updated.id)}), 200
    delete_module(db, module_id)
    db.close()
    return jsonify({'message': 'Deleted'}), 200

@app.route('/instructor/modules/<module_id>/files', methods=['POST', 'GET'])
def instructor_files(module_id):
    user_id, err = verify_instructor()
    if err:
        return err
    db = Session()
    module = get_module_by_id(db, module_id)
    if not module:
        db.close()
        return jsonify({'error': 'Module not found'}), 404
    course = get_course_by_id(db, module.course_id)
    if str(course.instructor_id) != str(user_id):
        db.close()
        return jsonify({'error': 'Forbidden'}), 403
    # POST: Upload file in module
    if request.method == 'POST':
        fobj = request.files.get('file')
        if not fobj:
            db.close()
            return jsonify({'error': 'Missing file'}), 400
        transcription = None
        mimetype = fobj.mimetype or ""
        print(f"📎 Uploaded file mimetype: {mimetype}")

        if mimetype.startswith("audio/") or mimetype in ["application/octet-stream", "video/mp4"]:
            print("🧠 Attempting transcription...")
            transcription = transcribe_audio(fobj)
            fobj.stream.seek(0)

        file_bytes = fobj.read()
        new_file = create_file(
            db,
            module_id=module_id,
            title=request.form.get('title', fobj.filename),
            filename=fobj.filename,
            file_type=fobj.mimetype,
            file_size=len(file_bytes),
            file_data=file_bytes
        )
        if transcription is not None:
            update_file(db, new_file.id, transcription=transcription)
        
        # Create temporary directory and write uploaded file
        tmp_root = tempfile.mkdtemp(prefix=f"faiss_tmp_{new_file.id}_")
        tmp_idx_dir = os.path.join(tmp_root, "faiss_index")
        os.makedirs(tmp_idx_dir, exist_ok=True)
        # If transcription, use transcribed text, otherwise use uploaded file
        if transcription is not None:
            input_filename = "transcription.txt"
            with open(os.path.join(tmp_idx_dir, input_filename), "w", encoding="utf-8") as txt:
                txt.write(transcription)
        else:
            # Extract file extension
            ext = os.path.splitext(fobj.filename)[1]
            input_filename = f"uploaded{ext}"
            with open(os.path.join(tmp_idx_dir, input_filename), "wb") as out:
                out.write(file_bytes)

        # Generate FAISS index files
        create_database(tmp_idx_dir)
        generate_citations(tmp_idx_dir)
        file_cleanup(tmp_idx_dir)

        # Read generated index files
        try:
            with open(os.path.join(tmp_idx_dir, "index.faiss"), "rb") as fidx:
                file_idx = fidx.read()
            with open(os.path.join(tmp_idx_dir, "index.pkl"), "rb") as fpkl:
                file_pkl = fpkl.read()
        except Exception as e:
            shutil.rmtree(tmp_root)
            db.close()
            return jsonify({'error': f'Failed to read index files: {e}'}), 500
        
        # Store index in DB
        app.logger.debug("FILE INDEX sizes:", len(file_idx), len(file_pkl))
        update_file(db, new_file.id,
                    index_faiss=file_idx,
                    index_pkl=file_pkl)        
        
        # Rebuild course-level index
        idx_bytes, pkl_bytes = rebuild_course_index(db, course.id)
        app.logger.debug("COURSE INDEX sizes:", len(idx_bytes), len(pkl_bytes))
        update_course(
            db,
            course_id=course.id,
            index_faiss=idx_bytes,
            index_pkl=pkl_bytes
        )
        store_file_embeddings(db, str(new_file.id))

        # Cleanup
        
        shutil.rmtree(tmp_root)
        db.close()

        return jsonify({
            'id':            str(new_file.id),
            'filename':      new_file.filename,
            'transcription': transcription
        }), 201

    # GET: Return file list
    files = get_files_by_module(db, module_id)
    db.close()

    return jsonify([
        {
            'id':       str(f.id),
            'title':    f.title,
            'filename': f.filename
        }
        for f in files
    ]), 200

@app.route('/instructor/modules/<module_id>/files/upload', methods=['POST'])
def upload_to_module(module_id):
    db = Session()
    try:
        file = request.files.get('file')
        if not file:
            return jsonify({"error": "No file uploaded"}), 400

        file_data = file.read()
        new_file = create_file(
            db,
            module_id=module_id,
            title=request.form.get('title', file.filename),
            filename=file.filename,
            file_type=file.mimetype,
            file_size=len(file_data),
            file_data=file_data,
        )

        num_chunks = store_file_embeddings(db, str(new_file.id))
        return jsonify({"message": f"File added and embedded into course. {num_chunks} chunks."})

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@app.route('/courses/<course_id>/search', methods=['POST'])
def search_course_chunks(course_id):
    db = Session()
    try:
        data = request.get_json()
        query = data.get("query")
        if not query:
            return jsonify({"error": "Missing query"}), 400

        # Embed the query sentence
        vector_list = openai_embed_text([query])[0].tolist()
        pgvector_str = f"[{','.join(map(str, vector_list))}]"

        # Perform vector similarity search
        sql = text("""
            SELECT content
            FROM "FileChunk"
            WHERE course_id = :cid
            ORDER BY embedding <-> :query_vec
            LIMIT 5
        """)
        rows = db.execute(sql, {"cid": course_id, "query_vec": pgvector_str}).fetchall()
        return jsonify({"results": [{"content": row[0]} for row in rows]})

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()

@app.route('/instructor/files/<file_id>', methods=['GET', 'PATCH', 'DELETE'])
def instructor_manage_file(file_id):
    user_id, err = verify_instructor()
    if err:
        return err
    db = Session()
    f = get_file_by_id(db, file_id)
    if not f:
        db.close()
        return jsonify({'error': 'Not found'}), 404
    m = get_module_by_id(db, f.module_id)
    course = get_course_by_id(db, m.course_id)
    if str(course.instructor_id) != str(user_id):
        db.close()
        return jsonify({'error': 'Forbidden'}), 403
    if request.method == 'GET':
        out = {
            'id': str(f.id),
            'title': f.title,
            'filename': f.filename,
            'fileType': f.file_type,
            'fileSize': f.file_size
        }
        db.close()
        return jsonify(out), 200
    if request.method == 'PATCH':
        data = request.get_json() or {}
        updated = update_file(db, file_id, **data)
        db.close()
        return jsonify({'id': str(updated.id)}), 200
    delete_file(db, file_id)
    db.close()
    return jsonify({'message': 'Deleted'}), 200

@app.route('/instructor/files/<file_id>/content', methods=['GET'])
def instructor_file_content(file_id):
    user_id, err = verify_instructor()
    if err:
        return err
    db = Session()
    f = get_file_by_id(db, file_id)
    if not f:
        db.close()
        return jsonify({'error': 'Not found'}), 404
    m = get_module_by_id(db, f.module_id)
    course = get_course_by_id(db, m.course_id)
    if str(course.instructor_id) != str(user_id):
        db.close()
        return jsonify({'error': 'Forbidden'}), 403
    data, mtype, fname = f.file_data, f.file_type, f.filename
    db.close()
    return Response(data, mimetype=mtype, headers={"Content-Disposition": f"inline; filename={fname}"})

@app.route('/student/profile', methods=['POST','GET','PATCH','DELETE'])
def student_profile():
    user_id, err = verify_student()
    if err:
        return err
    db = Session()

    if request.method == 'POST':
        data = request.get_json() or {}
        name            = data.get('name')
        onboard_answers = data.get('onboard_answers')
        want_quizzes    = data.get('want_quizzes')
        if not name:
            db.close()
            return jsonify({'error':'Name required'}), 400

        prof = create_student_profile(
            db,
            user_id,
            name,
            onboard_answers,
            want_quizzes
        )
        db.close()

        out = {
            'user_id':       str(prof.user_id),
            'name':          prof.name,
            'onboard_answers': prof.onboard_answers,
            'want_quizzes':  prof.want_quizzes,
            'model_preference': prof.model_preference
        }
        return jsonify(out), 201

    if request.method == 'GET':
        sp = get_student_profile(db, user_id)
        db.close()
        if not sp:
            return jsonify({'error':'Not found'}), 404

        out = {
            'user_id':       str(sp.user_id),
            'name':          sp.name,
            'onboard_answers': sp.onboard_answers,
            'want_quizzes':  sp.want_quizzes,
            'model_preference': sp.model_preference
        }
        return jsonify(out), 200

    if request.method == 'PATCH':
        data = request.get_json() or {}
        updated = update_student_profile(db, user_id, **data)
        db.close()
        return jsonify({'user_id': str(updated.user_id)}), 200

    # DELETE
    delete_student_profile(db, user_id)
    delete_user(db, user_id)
    db.close()
    resp = jsonify({'message':'Student deleted'})
    resp.set_cookie('session','',max_age=0)
    return resp, 200

@app.route('/student/enrollments', methods=['POST', 'GET'])
def student_enrollments():
    user_id, err = verify_student()
    if err:
        return err
    db = Session()
    if request.method == 'POST':
        code = request.get_json().get('accessCode')
        ac = get_access_code_by_code(db, code=code)
        if not ac:
            db.close()
            return jsonify({'error': 'Invalid code'}), 400
        if get_enrollment_by_student_course(db, user_id, ac.course_id):
            db.close()
            return jsonify({'message': 'Already enrolled'}), 200
        e = create_enrollment(db, user_id, ac.course_id)
        db.close()
        return jsonify({'id': str(e.id)}), 201
    ens = get_enrollments_by_student(db, user_id)
    db.close()
    return jsonify([{
        'id':        str(e.id),
        'courseId':  str(e.course_id),
        'enrolledAt': e.enrolled_at.isoformat()
    } for e in ens]), 200

@app.route('/student/files/<file_id>/content', methods=['GET'])
def student_file_content(file_id):
    user_id, err = verify_student()
    if err:
        return err

    db = Session()

    f = get_file_by_id(db, file_id)
    if not f:
        db.close()
        return jsonify({'error': 'Not found'}), 404

    mod = get_module_by_id(db, f.module_id)
    if not mod or not get_enrollment_by_student_course(db, user_id, mod.course_id):
        db.close()
        return jsonify({'error': 'Forbidden'}), 403

    data, mimetype, fname = f.file_data, f.file_type, f.filename
    db.close()
    return Response(
        data,
        mimetype=mimetype,
        headers={'Content-Disposition': f'inline; filename={fname}'}
    )

@app.route('/student/enrollments/<enrollment_id>', methods=['DELETE'])
def student_unenroll(enrollment_id):
    user_id, err = verify_student()
    if err:
        return err
    db = Session()
    e = get_enrollment(db, enrollment_id)
    if not e or str(e.user_id) != str(user_id):
        db.close()
        return jsonify({'error': 'Forbidden'}), 403
    delete_enrollment(db, user_id, e.course_id)
    db.close()
    return jsonify({'message': 'Unenrolled'}), 200

@app.route('/courses/<course_id>/moduleswithfiles', methods=['GET'])
def moduleswithfiles(course_id):
    session = get_user_session()
    if 'error' in session:
        return jsonify(session), 401

    firebase_uid = session['uid']
    db = Session()
    user = get_user_by_firebase_uid(db, firebase_uid)
    role = get_role_by_user_id(db, user.id)

    if role.role_type == 'student':
        if not get_enrollment_by_student_course(db, user.id, course_id):
            db.close()
            return jsonify({'error':'Forbidden'}), 403
    elif role.role_type == 'instructor':
        course = get_course_by_id(db, course_id)
        if not course or str(course.instructor_id) != str(user.id):
            db.close()
            return jsonify({'error':'Forbidden'}), 403
    else:
        db.close()
        return jsonify({'error':'Forbidden'}), 403

    modules = get_modules_by_course(db, course_id)
    out = []
    for m in modules:
        rows = get_files_without_raw_by_module(db, m.id)
        out.append({
            'id':       str(m.id),
            'title':    m.title,
            'ordering': m.ordering,
            'files': [
                {
                  'id':       str(row.id),
                  'title':    row.title,
                  'ordering': row.ordering,
                }
                for row in rows
            ]
        })

    db.close()
    return jsonify(out), 200

@app.route('/student/courses/<course_id>/modules', methods=['GET'])
def student_modules(course_id):
    user_id, err = verify_student()
    if err:
        return err
    db = Session()
    if not get_enrollment_by_student_course(db, user_id, course_id):
        db.close()
        return jsonify({'error': 'Forbidden'}), 403
    mods = get_modules_by_course(db, course_id)
    db.close()
    return jsonify([{'id': str(m.id), 'title': m.title} for m in mods]), 200

@app.route('/student/modules/<module_id>/files', methods=['GET'])
def student_files(module_id):
    user_id, err = verify_student()
    if err:
        return err
    db = Session()
    m = get_module_by_id(db, module_id)
    if not m or not get_enrollment_by_student_course(db, user_id, m.course_id):
        db.close()
        return jsonify({'error': 'Forbidden'}), 403
    files = get_files_by_module(db, module_id)
    db.close()
    return jsonify([{'id': str(f.id), 'title': f.title} for f in files]), 200

@app.route('/student/personalized-files', methods=['GET'])
def student_list_pfiles():
    user_id, err = verify_student()
    if err:
        return err
    db = Session()
    pfs = get_personalized_files_by_student(db, user_id)
    db.close()
    return jsonify([{
        'id': str(p.id),
        'originalFileId': str(p.original_file_id) if p.original_file_id else None,
        'createdAt': p.created_at.isoformat()
    } for p in pfs]), 200

@app.route('/generatepersonalizedfilecontent', methods=['POST'])
def generate_personalized_file_content():
    user_id, err = verify_student()
    if err:
        return err
    
    # Read and validate JSON body
    data = request.get_json()
    name = data.get("name")
    profile = data.get("userProfile", {})
    file_id = data.get("fileId")

    persona = []
    if name:
        persona.append(f'The user’s name is **{name}**')
    if profile.get("role"):
        persona.append(f'they are a **{profile["role"]}**')
    if profile.get("traits"):
        persona.append(f'they like their assistant to be **{profile["traits"]}**')
    if profile.get("learningStyle"):
        persona.append(f'their preferred learning style is **{profile["learningStyle"]}**')
    if profile.get("depth"):
        persona.append(f'they prefer **{profile["depth"]}-level** explanations')
    if profile.get("interests"):
        persona.append(f'they’re interested in **{profile["interests"]}**')
    if profile.get("personalization"):
        persona.append(f'they enjoy **{profile["personalization"]}**')
    if profile.get("schedule"):
        persona.append(f'they study best **{profile["schedule"]}**')
    full_persona = ". ".join(persona)

    # Fetch FAISS data from DB
    db_session = Session()
    try:
        file = get_file_by_id(db_session, file_id)
        if file:
            # Create temp directory
            tmp_root = tempfile.mkdtemp(prefix=f"faiss_tmp_{file_id}_")
            tmp_idx_dir = os.path.join(tmp_root, "faiss_index")
            os.makedirs(tmp_idx_dir, exist_ok=True) 
            
            faiss_bytes = file.index_faiss
            pkl_bytes = file.index_pkl
    except Exception as e:
        print(f"Error fetching file for ID {file_id}: {e}")
    finally:
        db_session.close()

    try:
        with open(os.path.join(tmp_idx_dir, "index.faiss"), "wb") as idx_faiss:
            idx_faiss.write(faiss_bytes)
        with open(os.path.join(tmp_idx_dir, "index.pkl"), "wb") as idx_pkl:
            idx_pkl.write(pkl_bytes)

        # Generate response using the temp directory
        response = prompt_generate_personalized_file_content(tmp_idx_dir, full_persona)
        # Verify JSON is valid
        try:
            response_json = json.loads(response)
        except (ValueError, AttributeError, IndexError) as e:
            return jsonify({"error": "Invalid JSON returned from AI response", "details": str(e)}), 400

        # Recursively remove temp directory
        shutil.rmtree(tmp_root)
            
        # Save personalized file to DB
        db = Session()
        print("Saving personalized file with original_file_id:", file_id)
        try:
            saved_file = create_personalized_file(
                db=db,
                user_id=user_id,
                original_file_id=file_id,
                content=response_json
            )
        finally:
            db.close()

        return jsonify({ "id": str(saved_file.id), "content": response_json}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/student/personalized-files/<pf_id>', methods=['GET'])
def get_student_personalized_file(pf_id):
    user_id, err = verify_student()
    if err:
        return err

    db = Session()
    pf = get_personalized_file_by_id(db, pf_id)

    if not pf or str(pf.user_id) != str(user_id):
        db.close()
        return jsonify({'error': 'Not found or unauthorized'}), 404

    response = {
        'id': str(pf.id),
        'originalFileId': str(pf.original_file_id) if pf.original_file_id else None,
        'createdAt': pf.created_at.isoformat(),
        'content': pf.content  
    }

    db.close()
    return jsonify(response), 200

@app.route('/student/chats', methods=['GET', 'POST'])
def student_chats():
    user_id, err = verify_student()
    if err:
        return err
    db = Session()
    if request.method == 'POST':
        data = request.get_json() or {}
        file_id = data.get('fileId')
        c = create_chat(db, user_id, file_id, data.get('title'))
        if file_id:
            f = get_file_by_id(db, file_id)
            f.chat_count += 1
            db.commit()
        db.close()
        return jsonify({'id': str(c.id)}), 201
    chats = get_chats_by_student(db, user_id)
    db.close()
    return jsonify([{'id': str(c.id), 'title': c.title} for c in chats]), 200

@app.route('/student/chats/<chat_id>', methods=['GET', 'PATCH', 'DELETE'])
def student_manage_chat(chat_id):
    user_id, err = verify_student()
    if err:
        return err
    db = Session()
    chat = get_chat_by_id(db, chat_id)
    if not chat or str(chat.user_id) != str(user_id):
        db.close()
        return jsonify({'error': 'Forbidden'}), 403
    if request.method == 'GET':
        out = {'id': str(chat.id), 'title': chat.title}
        db.close()
        return jsonify(out), 200
    if request.method == 'PATCH':
        data = request.get_json() or {}
        updated = update_chat(db, chat_id, **data)
        db.close()
        return jsonify({'id': str(updated.id)}), 200
    delete_chat(db, chat_id)
    db.close()
    return jsonify({'message': 'Deleted'}), 200


@app.route('/student/chats/<chat_id>/messages', methods=['GET', 'POST'])
def student_messages(chat_id):
    user_id, err = verify_student()
    if err:
        return err
    db = Session()
    if request.method == 'POST':
        data = request.get_json() or {}
        m = create_message(db, chat_id, data['role'], data['content'])
        db.close()
        return jsonify({'id': str(m.id)}), 201
    msgs = get_messages_by_chat(db, chat_id)
    db.close()
    return jsonify([{'id': str(m.id), 'role': m.role, 'content': m.content} for m in msgs]), 200


@app.route('/delete-trailing-messages', methods=['POST'])
def student_delete_trailing():
    user_id, err = verify_student()
    if err:
        return err
    data = request.get_json() or {}
    msg_id = data.get('id')
    if not msg_id:
        return jsonify({'error': 'Message ID required'}), 400
    db = Session()
    msg = get_message_by_id(db, msg_id)
    if not msg or str(msg.chat.user_id) != str(user_id):
        db.close()
        return jsonify({'error': 'Forbidden'}), 403
    delete_messages_after(db, chat_id=msg.chat_id, timestamp=msg.created_at)
    db.close()
    return jsonify({'message': 'Deleted trailing messages'}), 200


@app.route('/instructor/courses/<course_id>/reports', methods=['GET'])
def instructor_get_report(course_id):
    user_id, err = verify_instructor()
    if err:
        return err
    db = Session()
    try:
        course = get_course_by_id(db, course_id)
        if not course or str(course.instructor_id) != str(user_id):
            return jsonify({'error': 'Forbidden'}), 403
        rpt = get_report_by_course(db, course_id)
        if not rpt:
            return jsonify({'error': 'Not found'}), 404
        return jsonify({'id': str(rpt.id), 'summary': rpt.summary}), 200
    finally:
        db.close()


@app.route('/instructor/courses/<course_id>/reports', methods=['POST'])
def instructor_create_or_update_report(course_id):
    user_id, err = verify_instructor()
    if err:
        return err
    db = Session()
    try:
        course = get_course_by_id(db, course_id)
        if not course or str(course.instructor_id) != str(user_id):
            return jsonify({'error': 'Forbidden'}), 403
        file_metrics = get_file_metrics_for_course(db, course_id)
        module_metrics = get_module_metrics_for_course(db, course_id)
        questions = get_student_questions_for_course(db, course_id)
        faqs_obj = prompt_course_faqs(get_course_title(db, course_id), questions)
        summary = {
            'fileMetrics': file_metrics,
            'moduleMetrics': module_metrics,
            'faqs': faqs_obj.get('faqs', [])
        }
        existing = get_report_by_course(db, course_id)
        if existing:
            rpt, status = update_report(db, existing.id, summary=summary), 200
        else:
            rpt, status = create_report(db, course_id, summary), 201
        return jsonify({'id': str(rpt.id), 'summary': rpt.summary}), status
    finally:
        db.close()


@app.route('/instructor/reports/<report_id>', methods=['PATCH'])
def instructor_update_report(report_id):
    user_id, err = verify_instructor()
    if err:
        return err
    data = request.get_json() or {}
    if 'summary' not in data:
        return jsonify({'error': 'summary required'}), 400
    db = Session()
    try:
        rpt = get_report_by_id(db, report_id)
        if not rpt:
            return jsonify({'error': 'Not found'}), 404
        course = get_course_by_id(db, rpt.course_id)
        if not course or str(course.instructor_id) != str(user_id):
            return jsonify({'error': 'Forbidden'}), 403
        updated = update_report(db, report_id, summary=data['summary'])
        result = {'id': str(updated.id), 'summary': updated.summary}
    finally:
        db.close()
    return jsonify(result), 200


@app.route('/instructor/reports/<report_id>', methods=['DELETE'])
def instructor_delete_report(report_id):
    user_id, err = verify_instructor()
    if err:
        return err
    db = Session()
    try:
        rpt = get_report_by_id(db, report_id)
        if not rpt:
            return jsonify({'error': 'Not found'}), 404
        course = get_course_by_id(db, rpt.course_id)
        if not course or str(course.instructor_id) != str(user_id):
            return jsonify({'error': 'Forbidden'}), 403
        delete_report(db, report_id)
    finally:
        db.close()
    return '', 204

@app.route('/ai-chat', methods=['POST'])
def ai_chat():
    try:
        # 1. Verify student session
        user_id, err = verify_student()
        if err:
            return err

        # 2. Parse request
        data = request.get_json() or {}
        chat_id      = data.get('id')
        file_id      = data.get('fileId')
        user_message = data.get('userMessage') or data.get('message')
        history      = data.get('messages', [])

        if not user_message:
            return jsonify({'error': 'User message is required'}), 400

        db = Session()
        course_id = None
        f = get_file_by_id(db, file_id)
        print(f"Saving to chat ID: {chat_id}")
        
      # 3. Get or create Chat
        if chat_id:
            chat = get_chat_by_id(db, chat_id)
            if not chat or str(chat.user_id) != str(user_id):
                db.close()
                return jsonify({'error': 'Forbidden'}), 403
        else:
            if not file_id:
                db.close()
                return jsonify({'error': 'Missing fileId for new chat'}), 400

            # Look up the original file_id from the PersonalizedFile
            files = get_personalized_files_by_student(db, user_id)
            personalized_file = next(
                (pf for pf in files if str(pf.original_file_id) == str(file_id)),
                None
            )
            print("Personalized File ID:")
            print(personalized_file.id)
            if not personalized_file:
                db.close()
                return jsonify({'error': 'No personalized file found for this original fileId'}), 404

            chat = create_chat(db, user_id, file_id, title='New Chat')
            chat_id = str(chat.id)

            if f:
                f.chat_count += 1
                db.commit()

        if not f or not f.module:
            db.close()
            return jsonify({'error': 'File or module not found'}), 404

        course_id = f.module.course_id
        # 4. Save incoming user message
        create_message(db, chat_id, role='user', content=user_message)

        # 5. Embed query and retrieve top 5 chunks
        vector_list = openai_embed_text([user_message])[0].tolist()
        pgvector_str = f"[{','.join(map(str, vector_list))}]"

        sql = text("""
            SELECT content
            FROM "FileChunk"
            WHERE course_id = :cid
            ORDER BY embedding <-> :query_vec
            LIMIT 3
        """)
        rows = db.execute(sql, {"cid": course_id, "query_vec": pgvector_str}).fetchall()
        retrieved_chunks = [row[0] for row in rows if row[0]]

        # 6. Build messages for OpenAI
        messages = [
                {
                "role": "system",
                "content": (
                    "You are a helpful and knowledgeable AI tutor assisting a student. "
                    "You must use the student's background and interests to personalize each explanation and response. "
                    "If course content is relevant to the user’s message, you must use it to answer. "
                    "If the question is relevant to course material, but not specifically included, you can use your greater knowledge outside of course content. "
                    "If it is not relevant, do not fabricate an answer. Instead, respond with:\n\n"
                    "\"I'm here to help with this course, but that question isn't related to the material we've covered.\"\n\n"
                    "Avoid speculation or answering based on general knowledge if the topic isn't in the course context."
                )
            }   
        ]

        if retrieved_chunks:
            context_string = "\n\n".join(
                [f"Chunk {i+1}:\n{chunk.strip()}" for i, chunk in enumerate(retrieved_chunks)]
            )
            material_prompt = {
                "role": "system",
                "content": (
                    "The following excerpts are from course materials. You must use them to answer the student's question if relevant:\n\n"
                    f"{context_string}"
                )
            }
            messages.append(material_prompt)

        # Add chat history
        for m in history:
            if m.get("role") and m.get("content"):
                messages.append({
                    "role": m["role"],
                    "content": m["content"]
                })

        messages.append({"role": "user", "content": user_message})

         # 7. Build persona prompt from StudentProfile
        sp = get_student_profile(db, user_id)
        if not sp:
            db.close()
            return jsonify({'error': 'Student profile not found'}), 404

        answers = sp.onboard_answers or {}
        name           = sp.name
        job            = answers.get('job')
        traits         = answers.get('traits')
        learning_style = answers.get('learningStyle')
        depth          = answers.get('depth')
        topics         = answers.get('topics')
        interests      = answers.get('interests')
        schedule       = answers.get('schedule')

        persona_bits = []
        if name:           persona_bits.append(f"Name: {name}")
        if job:            persona_bits.append(f"Occupation: {job}")
        if traits:         persona_bits.append(f"Preferred tone: {traits}")
        if learning_style: persona_bits.append(f"Learning style: {learning_style}")
        if depth:          persona_bits.append(f"Depth: {depth}")
        if topics:         persona_bits.append(f"Topics: {topics}")
        if interests:      persona_bits.append(f"Interests: {interests}")
        if schedule:       persona_bits.append(f"Schedule: {schedule}")
        persona_string = " • ".join(persona_bits)

        expertise_map = {
            'beginner':     'They prefer simple, clear explanations.',
            'intermediate': 'They want moderate technical depth.',
            'advanced':     'They want in-depth, technical explanations.',
        }
        expertise_summary = expertise_map.get(
            (depth or '').lower(),
            expertise_map['beginner']
        )

        persona_msg = {
            'role': 'system',
            'content': f"{persona_string}. {expertise_summary}"
        }

        messages.append(persona_msg)

        print(messages)

        # 8. Call OpenAI
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.5,
            max_tokens=300,
        )

        assistant_reply = resp.choices[0].message.content.strip()

        # 9. Save assistant reply (optional)
        create_message(db, chat_id, role="assistant", content=assistant_reply)

        db.close()

        # 10. Return result
        return jsonify({"assistant": assistant_reply, "chatId": chat_id}), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


@app.route('/courses/<course_id>/citations', methods=['GET'])
def citations_route(course_id):
    course = get_course_by_id(Session(), course_id)
    if not course.index_pkl:
        return jsonify({'error':'No index built'}), 404
    metadata = pickle.loads(course.index_pkl)
    citations = [
      {'source': md.get('source','Unknown'),
       'citation': f"Mock APA Citation for {md.get('filename')}"}
      for md in metadata.values()
    ]
    return jsonify({'citations': citations}), 200

@app.route('/sessionLogin', methods=['POST'])
def session_login():
    data = request.get_json() or {}
    id_token = data.get('idToken')
    if not id_token:
        return jsonify({'error': 'Missing idToken'}), 400
    try:
        auth.verify_id_token(id_token)
        expires = 60 * 60 * 24 * 5
        session_cookie = auth.create_session_cookie(id_token, expires_in=expires)
        resp = jsonify({'message': 'Session set'})
        resp.set_cookie('session',
                        session_cookie,
                        max_age=expires,
                        httponly=True,
                        samesite='Strict')
        return resp, 200
    except Exception as e:
        return jsonify({'error': str(e)}), 401

@app.route('/sessionLogout', methods=['POST'])
def session_logout():
    resp = jsonify({'message': 'Logged out'})
    resp.set_cookie('session', '', max_age=0)
    return resp, 200

@app.route('/admin/users', methods=['GET', 'POST'])
def admin_users():
    admin_id, err = verify_admin()
    if err:
        return err
    db = Session()
    if request.method == 'GET':
        from src.db.schema import User
        users = db.query(User).all()
        result = []
        for u in users:
            role = get_role_by_user_id(db, u.id)
            result.append({
                'id': str(u.id),
                'email': u.email,
                'role': role.role_type if role else None
            })
        db.close()
        return jsonify(result), 200

    data = request.get_json() or {}
    email = data.get('email')
    pwd = data.get('password')
    role_type = data.get('role_type')
    name = data.get('name')
    if not (email and pwd and role_type and name):
        db.close()
        return jsonify({'error': 'email, password, role_type, and name are required'}), 400
    user = create_user(db, email, pwd, firebase_uid='', role_type=role_type)
    if role_type == 'instructor':
        create_instructor_profile(db, user.id, name)
    elif role_type == 'student':
        create_student_profile(db, user.id, name, onboard_answers={}, want_quizzes=False)
    elif role_type == 'admin':
        create_admin_profile(db, user.id, name)
    db.close()
    return jsonify({'id': str(user.id), 'email': user.email, 'role': role_type}), 201

@app.route('/admin/users/<user_id>', methods=['GET', 'PATCH', 'DELETE'])
def admin_manage_user(user_id):
    admin_id, err = verify_admin()
    if err:
        return err
    db = Session()
    user = get_user_by_id(db, user_id)
    if not user:
        db.close()
        return jsonify({'error': 'Not found'}), 404

    if request.method == 'GET':
        role = get_role_by_user_id(db, user_id)
        db.close()
        return jsonify({
            'id': str(user.id),
            'email': user.email,
            'role': role.role_type if role else None
        }), 200

    if request.method == 'PATCH':
        data = request.get_json() or {}
        updated = update_user(db, user_id=user_id, **data)
        if 'role_type' in data:
            set_role(db, user_id, data['role_type'])
        db.close()
        return jsonify({'id': str(updated.id), 'email': updated.email}), 200

    delete_user(db, user_id)
    db.close()
    return jsonify({'message': 'Deleted'}), 200

@app.route('/admin/news', methods=['GET', 'POST'])
def admin_news():
    admin_id, err = verify_admin()
    if err:
        return err
    db = Session()
    from src.db.queries import list_news, create_news
    if request.method == 'GET':
        items = list_news(db)
        db.close()
        return jsonify([{
            'id': str(n.id), 'title': n.title, 'subject': n.subject, 'link': n.link
        } for n in items]), 200

    data = request.get_json() or {}
    title = data.get('title')
    subject = data.get('subject')
    link = data.get('link')
    if not (title and subject and link):
        db.close()
        return jsonify({'error': 'title, subject, and link required'}), 400
    n = create_news(db, title, subject, link)
    db.close()
    return jsonify({'id': str(n.id)}), 201

@app.route('/admin/news/<news_id>', methods=['GET', 'PATCH', 'DELETE'])
def admin_manage_news(news_id):
    admin_id, err = verify_admin()
    if err:
        return err
    db = Session()
    from src.db.queries import get_news_by_id, update_news, delete_news
    n = get_news_by_id(db, news_id)
    if not n:
        db.close()
        return jsonify({'error': 'Not found'}), 404

    if request.method == 'GET':
        db.close()
        return jsonify({
            'id': str(n.id), 'title': n.title, 'subject': n.subject, 'link': n.link
        }), 200

    if request.method == 'PATCH':
        data = request.get_json() or {}
        updated = update_news(db, news_id, **data)
        db.close()
        return jsonify({'id': str(updated.id)}), 200

    delete_news(db, news_id)
    db.close()
    return jsonify({'message': 'Deleted'}), 200

@app.route('/admin/market', methods=['GET', 'POST'])
def admin_market():
    admin_id, err = verify_admin()
    if err:
        return err
    db = Session()
    from src.db.queries import list_market, create_market
    if request.method == 'GET':
        items = list_market(db)
        db.close()
        return jsonify([{
            'id': str(m.id), 'snp500': float(m.snp500), 'date': m.date.isoformat()
        } for m in items]), 200

    data = request.get_json() or {}
    snp500 = data.get('snp500')
    date = data.get('date')
    if snp500 is None or date is None:
        db.close()
        return jsonify({'error': 'snp500 and date required'}), 400
    m = create_market(db, snp500, date)
    db.close()
    return jsonify({'id': str(m.id)}), 201

@app.route('/admin/market/<market_id>', methods=['GET', 'PATCH', 'DELETE'])
def admin_manage_market(market_id):
    admin_id, err = verify_admin()
    if err:
        return err
    db = Session()
    from src.db.queries import get_market_by_id, update_market, delete_market
    m = get_market_by_id(db, market_id)
    if not m:
        db.close()
        return jsonify({'error': 'Not found'}), 404

    if request.method == 'GET':
        db.close()
        return jsonify({
            'id': str(m.id), 'snp500': float(m.snp500), 'date': m.date.isoformat()
        }), 200

    if request.method == 'PATCH':
        data = request.get_json() or {}
        updated = update_market(db, market_id, **data)
        db.close()
        return jsonify({'id': str(updated.id)}), 200

    delete_market(db, market_id)
    db.close()
    return jsonify({'message': 'Deleted'}), 200

@app.route('/generate-title', methods=['POST'])
def generate_title():
    data = request.get_json() or {}
    message = data.get('message')
    if not message:
        return jsonify({'error': 'Message is required'}), 400

    title = message[:80]
    return jsonify({'title': title}), 200

@app.route('/save-model-id', methods=['POST'])
def save_model_id():
    user_id, err = verify_student()
    if err:
        return err

    data = request.get_json() or {}
    model = data.get('model')
    if not model:
        return jsonify({'error': 'Model ID is required'}), 400

    db = Session()
    updated = update_student_profile(db, user_id, model_preference=model)
    db.close()

    return jsonify({
        'message': f'Model ID {model} saved successfully',
        'model_preference': updated.model_preference
    }), 200

# Analytics Routes

@app.route('/student/files/<file_id>/view-raw', methods=['POST'])
def raw_file_view(file_id):
    user_id, err = verify_student()
    if err:
        return err
    db = Session()
    f = get_file_by_id(db, file_id)
    if not f:
        db.close()
        return jsonify({'error': 'File not found'}), 404
    m = get_module_by_id(db, f.module_id)
    if not m or not get_enrollment_by_student_course(db, user_id, m.course_id):
        db.close()
        return jsonify({'error': 'Forbidden'}), 403
    f.view_count_raw += 1
    db.commit()
    db.close()
    return '', 204

@app.route('/student/files/<file_id>/view-personalized', methods=['POST'])
def personalized_file_view(file_id):
    user_id, err = verify_student()
    if err:
        return err
    db = Session()
    f = get_file_by_id(db, file_id)
    if not f:
        db.close()
        return jsonify({'error': 'File not found'}), 404
    m = get_module_by_id(db, f.module_id)
    if not m or not get_enrollment_by_student_course(db, user_id, m.course_id):
        db.close()
        return jsonify({'error': 'Forbidden'}), 403
    f.view_count_personalized += 1
    db.commit()
    db.close()
    return '', 204

@app.route('/instructor/courses/<course_id>/faqs', methods=['GET'])
def instructor_course_faqs(course_id):
    user_id, err = verify_instructor()
    if err:
        return err
    db = Session()
    try:
        course = get_course_by_id(db, course_id)
        if not course or str(course.instructor_id) != str(user_id):
            return jsonify({'error': 'Forbidden'}), 403
        questions = get_student_questions_for_course(db, course_id)
        title     = get_course_title(db, course_id)
    finally:
        db.close()
    faqs_payload = prompt_course_faqs(title, questions)
    return jsonify(faqs_payload), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=True)