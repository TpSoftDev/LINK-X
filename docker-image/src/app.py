import os
import uuid
import tempfile
import pickle
import faiss
import numpy as np
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
from textUtils import openai_embed_text
from io import BytesIO

from src.db.queries import (
    # User & Role
    get_access_code_by_id, get_enrollment, get_user_by_id, get_user_by_email, get_user_by_firebase_uid,
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
    get_report_by_id, get_reports_by_course, create_report, update_report, delete_report
)



load_dotenv()
app = Flask(__name__)
CORS(app, supports_credentials=True)

app.config['TESTING'] = True

cred = credentials.Certificate(os.getenv("FIREBASE_KEY_PATH", "firebaseKey.json"))
firebase_admin.initialize_app(cred)

POSTGRES_URL = os.getenv("POSTGRES_URL")
if not POSTGRES_URL:
    raise RuntimeError("POSTGRES_URL not set")
engine = create_engine(POSTGRES_URL, pool_pre_ping=True,)
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
    user_id = session['uid']
    db = Session()
    role = get_role_by_user_id(db, user_id)
    db.close()
    if not role or role.role_type != required_role:
        return None, (jsonify({'error': 'Forbidden'}), 403)
    return user_id, None


def verify_admin():    return verify_role('admin')
def verify_instructor(): return verify_role('instructor')
def verify_student():   return verify_role('student')

@app.route('/me', methods=['GET'])
def me_get():
    session = get_user_session()
    if 'error' in session:
        return jsonify(session), 401

    user_id = session['uid']
    db = Session()
    user = get_user_by_id(db, user_id)
    role = get_role_by_user_id(db, user_id)
    profile_data = None
    if role.role_type == 'instructor':
        prof = get_instructor_profile(db, user_id)
        if prof:
            profile_data = {
                'user_id':     str(prof.user_id),
                'name':        prof.name,
                'university':  prof.university
            }
    elif role.role_type == 'student':
        prof = get_student_profile(db, user_id)
        if prof:
            profile_data = {
                'user_id':          str(prof.user_id),
                'name':             prof.name,
                'onboard_answers':  prof.onboard_answers,
                'want_quizzes':     prof.want_quizzes,
                'model_preference': prof.model_preference
            }
    elif role.role_type == 'admin':
        prof = get_admin_profile(db, user_id)
        if prof:
            profile_data = {
                'user_id': str(prof.user_id),
                'name':    prof.name
            }

    db.close()

    return jsonify({
        'id':      str(user_id),
        'email':   user.email,
        'role':    role.role_type,
        'profile': profile_data
    }), 200

@app.route('/me', methods=['PATCH'])
def me_patch():
    session = get_user_session()
    if 'error' in session:
        return jsonify(session), 401
    user_id = session['uid']
    data = request.get_json() or {}
    db = Session()
    updated = update_user(db, user_id=user_id, **data)
    db.close()
    if not updated:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'id': str(updated.id), 'email': updated.email}), 200

@app.route('/me', methods=['DELETE'])
def me_delete():
    session = get_user_session()
    if 'error' in session:
        return jsonify(session), 401
    user_id = session['uid']
    db = Session()
    delete_user(db, user_id)
    db.close()
    resp = jsonify({'message': 'Account deleted'})
    resp.set_cookie('session', '', max_age=0)
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
    if not email or not pwd:
        return jsonify({'error':'Email and password required'}), 400

    db = Session()
    user = create_user(db, email, pwd, firebase_uid, 'instructor')
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

@app.route('/instructor/courses', methods=['POST', 'GET'])
def instructor_courses():
    user_id, err = verify_instructor()
    if err: return err
    db = Session()
    if request.method == 'POST':
        data = request.get_json() or {}
        c = create_course(db, data['title'], data.get('description',''), user_id)
        code = uuid.uuid4().hex[:8]
        create_access_code(db, course_id=c.id, code=code)
        db.close()
        return jsonify({'id': str(c.id), 'accessCode': code}), 201
    courses = get_courses_by_instructor_id(db, user_id)
    db.close()
    return jsonify([{'id':str(c.id), 'title':c.title} for c in courses]), 200

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
    if err: return err
    db = Session()
    c = get_course_by_id(db, course_id)
    if not c or str(c.instructor_id)!=str(user_id):
        db.close(); return jsonify({'error':'Forbidden'}), 403
    if request.method == 'POST':
        code = uuid.uuid4().hex[:8]
        ac = create_access_code(db, course_id=course_id, code=code)
        db.close(); return jsonify({'id':str(ac.id), 'code':ac.code}), 201
    acs = get_access_code_by_code(db, course_id)
    db.close(); return jsonify([{'id':str(a.id),'code':a.code} for a in acs]), 200

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
    if request.method == 'POST':
        fobj = request.files.get('file')
        if not fobj:
            db.close()
            return jsonify({'error': 'Missing file'}), 400
        transcription = None
        if fobj.mimetype.startswith('audio/'):
            try:
                transcription = transcribe_audio(fobj)
                fobj.stream.seek(0)
            except Exception as e:
                app.logger.error(f"Transcription failed: {e}")
        data = fobj.read()
        new_file = create_file(
            db,
            module_id=module_id,
            title=request.form.get('title', fobj.filename),
            filename=fobj.filename,
            file_type=fobj.mimetype,
            file_size=len(data),
            file_data=data
        )
        if transcription is not None:
            update_file(db, new_file.id, transcription=transcription)
        idx_bytes, pkl_bytes = rebuild_course_index(db, course.id)
        update_course(
            db,
            course_id=course.id,
            index_faiss=idx_bytes,
            index_pkl=pkl_bytes
        )
        db.close()
        #store_file_embeddings(db, new_file.id)
        return jsonify({
            'id':            str(new_file.id),
            'filename':      new_file.filename,
            'transcription': transcription
        }), 201
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

@app.route('/courses/<course_id>/upload', methods=['POST'])
def upload_to_course(course_id):
    db = Session()
    try:
        file = request.files.get('file')
        if not file:
            return jsonify({"error": "No file uploaded"}), 400

        course = get_course_by_id(db, course_id)
        if not course or not course.modules:
            return jsonify({"error": "Course or module not found"}), 404

        first_module = course.modules[0]  # assumes modules are ordered

        file_data = file.read()
        new_file = create_file(
            db,
            module_id=first_module.id,
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
        onboard_answers = data.get('onboard_answers', {})
        want_quizzes    = data.get('want_quizzes', False)
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
    # TODO: hook into your AI pipeline; stub for now
    return jsonify({'error': 'Not implemented'}), 501

@app.route('/student/personalized-files/<pf_id>', methods=['GET'])
def student_get_pfile(pf_id):
    user_id, err = verify_student()
    if err:
        return err
    db = Session()
    pf = get_personalized_file_by_id(db, pf_id)
    db.close()
    if not pf or str(pf.user_id) != str(user_id):
        return jsonify({'error': 'Forbidden'}), 403
    return jsonify({'id': str(pf.id), 'content': pf.content}), 200

@app.route('/student/chats', methods=['GET', 'POST'])
def student_chats():
    user_id, err = verify_student()
    if err:
        return err
    db = Session()
    if request.method == 'POST':
        data = request.get_json() or {}
        c = create_chat(db, user_id, data.get('fileId'), data['title'])
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
def instructor_list_reports(course_id):
    user_id, err = verify_instructor()
    if err:
        return err
    db = Session()
    rpts = get_reports_by_course(db, course_id)
    db.close()
    return jsonify([{'id': str(r.id), 'createdAt': r.created_at.isoformat()} for r in rpts]), 200

@app.route('/instructor/reports/<report_id>', methods=['GET', 'PATCH', 'DELETE'])
def instructor_manage_report(report_id):
    user_id, err = verify_instructor()
    if err:
        return err
    db = Session()
    r = get_report_by_id(db, report_id)
    if not r:
        db.close()
        return jsonify({'error': 'Not found'}), 404
    course = get_course_by_id(db, r.course_id)
    if str(course.instructor_id) != str(user_id):
        db.close()
        return jsonify({'error': 'Forbidden'}), 403
    if request.method == 'GET':
        out = {'id': str(r.id), 'summary': r.summary}
        db.close()
        return jsonify(out), 200
    if request.method == 'PATCH':
        data = request.get_json() or {}
        updated = update_report(db, report_id, **data)
        db.close()
        return jsonify({'id': str(updated.id)}), 200
    delete_report(db, report_id)
    db.close()
    return jsonify({'message': 'Deleted'}), 200

@app.route('/instructor/reports', methods=['POST'])
def instructor_create_report():
    user_id, err = verify_instructor()
    if err:
        return err
    data = request.get_json() or {}
    db = Session()
    r = create_report(db, data['courseId'], data['summary'])
    db.close()
    return jsonify({'id': str(r.id)}), 201

@app.route('/ai-chat', methods=['POST'])
def ai_chat():
    # 1. Verify student session
    user_id, err = verify_student()
    if err:
        return err

    # 2. Parse request
    data = request.get_json() or {}
    chat_id      = data.get('id')
    user_message = data.get('userMessage') or data.get('message')
    history      = data.get('messages', [])

    if not user_message:
        return jsonify({'error': 'User message is required'}), 400

    db = Session()

    # 3. Get or create Chat
    if chat_id:
        chat = get_chat_by_id(db, chat_id)
        if not chat or str(chat.user_id) != str(user_id):
            db.close()
            return jsonify({'error': 'Forbidden'}), 403
    else:
        chat = create_chat(db, user_id, None, title='New Chat')
        chat_id = str(chat.id)

    # 4. Save incoming user message
    create_message(db, chat_id, role='user', content=user_message)

    # 5. Build persona prompt from StudentProfile
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

    # 6. Compose system + persona messages
    system_msg = {
        'role': 'system',
        'content': (
            'You are a friendly AI tutor. Use the user’s background to give examples.'
        )
    }
    persona_msg = {
        'role': 'system',
        'content': f"{persona_string}. {expertise_summary}"
    }

    # 7. Build chat stack
    messages = [system_msg, persona_msg]
    for m in history:
        messages.append({'role': m.get('role'), 'content': m.get('content')})
    messages.append({'role': 'user', 'content': user_message})

    # 8. Call OpenAI
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    resp = client.chat.completions.create(
        model='gpt-4o',
        messages=messages,
        max_tokens=300,
        temperature=0.7,
    )
    assistant_content = resp.choices[0].message.content.strip()

    # 9. Persist assistant reply
    create_message(db, chat_id, role='assistant', content=assistant_content)

    db.close()

    # 10. Return assistant response and chatId
    return jsonify({'assistant': assistant_content, 'chatId': chat_id}), 200

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

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=True)