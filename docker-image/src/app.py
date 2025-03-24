from datetime import date
import os
import firebase_admin
from firebase_admin import auth, credentials
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import faiss
import pickle
import numpy as np
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.db.schema import Base, Suggestion, User, Document, Chat, Message, Vote, Onboarding
from alembic import command
from alembic.config import Config

from src.db.queries import (
    delete_market_item_by_id, delete_news_by_id, get_all_news, get_market_item_by_id, get_news_by_id, get_recent_market_prices, 
    get_user_by_email, create_user, save_chat, delete_chat_by_id, get_chats_by_user_id,
    get_chat_by_id, save_market_item, save_messages, get_messages_by_chat_id, save_news_item, vote_message,
    get_votes_by_chat_id, save_document, get_documents_by_id, get_document_by_id,
    delete_documents_by_id_after_timestamp, save_suggestions, get_suggestions_by_document_id,
    get_message_by_id, delete_messages_by_chat_id_after_timestamp, update_chat_visibility_by_id, 
    create_onboarding
)

load_dotenv()

# Initialize Flask
app = Flask(__name__)
CORS(app)

# Initialize Firebase Admin
cred = credentials.Certificate("firebaseKey.json")
firebase_admin.initialize_app(cred)

# SQLAlchemy configuration
POSTGRES_URL = os.getenv("POSTGRES_URL")
if not POSTGRES_URL:
    raise ValueError("POSTGRES_URL is not defined in the environment")

# Create engine, session, and tables
engine = create_engine(POSTGRES_URL)
Session = sessionmaker(bind=engine)
Base.metadata.create_all(engine)

# FAISS and metadata paths
INDEX_PATH = "/app/"
PICKLE_PATH = "/app/"

# Attempt to load FAISS index
try:
    faiss_index = faiss.read_index("/app/index.faiss")
    print("FAISS index successfully loaded from /app/index.faiss")
except Exception as e:
    print(f"Error loading FAISS index: {e}")
    faiss_index = None

# Attempt to load metadata
try:
    with open("/app/index.pkl", "rb") as f:
        metadata = pickle.load(f)
    print("Metadata successfully loaded from /app/index.pkl")
except Exception as e:
    print(f"Error loading metadata: {e}")
    metadata = None


# Firebase Token Verification
def verify_session_cookie():
    session_cookie = request.cookies.get('session')
    if not session_cookie:
        return jsonify({"error": "Unauthorized - Missing session cookie"}), 401

    try:
        decoded_claims = auth.verify_session_cookie(session_cookie, check_revoked=True)
        return decoded_claims
    except Exception as e:
        return jsonify({"error": str(e)}), 401


# Unprotected Routes
@app.route('/')
def home():
    """Serve the main UI."""
    return render_template('index.html')

@app.route('/citations', methods=['GET'])
def citations():
    """Example unprotected route that returns citation data (if you want it public)."""
    try:
        citation_data = []
        if metadata:
            for idx, doc in enumerate(metadata.values()):
                citation_data.append({
                    "source": doc.metadata.get("source", "Unknown"),
                    "citation": f"Mock APA Citation for Document {idx + 1}"
                })
        return jsonify({"citations": citation_data})
    except Exception as e:
        return jsonify({"error": f"Error generating citations: {e}"}), 500

@app.route('/migrate', methods=['POST'])
def migrate():
    """Run Alembic migrations (optionally protected if needed)."""
    # If you want to protect migrations, uncomment the following:
    # user = verify_session_cookie()
    # if isinstance(user, dict) and "error" in user:
    #     return user

    try:
        alembic_cfg = Config("alembic.ini")
        alembic_cfg.set_main_option("sqlalchemy.url", POSTGRES_URL)

        print("⏳ Running migrations...")
        command.upgrade(alembic_cfg, "head")
        print("✅ Migrations completed.")

        return jsonify({"message": "Migrations completed successfully!"}), 200
    except Exception as e:
        return jsonify({"error": f"Error running migrations: {str(e)}"}), 500


# Protected Routes

@app.route('/onboarding', methods=['POST'])
def create_onboarding_route():
    data = request.get_json()
    required_fields = ["userId", "name", "quizzes"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        db_session = Session()
        new_onboarding = create_onboarding(
            db=db_session,
            user_id=data["userId"],
            name=data["name"],
            job=data.get("job"),
            traits=data.get("traits"),
            learningStyle=data.get("learningStyle"),
            depth=data.get("depth"),
            topics=data.get("topics"),
            interests=data.get("interests"),
            schedule=data.get("schedule"),
            quizzes=data["quizzes"],
        )
        return jsonify({"message": "Onboarding record created", "id": str(new_onboarding.id)}), 201
    except Exception as e:
        print("Error creating onboarding record:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/createUser', methods=['POST'])
def create_user_route():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    db_session = Session()
    try:
        new_user = create_user(db_session, email, password)
        return jsonify({"id": str(new_user.id), "email": new_user.email}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db_session.close()

@app.route('/sessionLogout', methods=['POST'])
def session_logout():

    response = jsonify({'message': 'Logged out'})
    response.set_cookie('session', '', max_age=0)
    return response

@app.route('/sessionLogin', methods=['POST'])
def session_login():
    data = request.get_json()
    id_token = data.get('idToken')
    if not id_token:
        return jsonify({'error': 'Missing ID token'}), 400

    try:

        expires_in = 60 * 60 * 24 * 5
        session_cookie = auth.create_session_cookie(id_token, expires_in=expires_in)

        response = jsonify({'message': 'Session cookie set'})

        response.set_cookie(
            'session',
            session_cookie,
            max_age=expires_in, 
            httponly=True,      
            secure=True,        
            samesite='Strict'  
        )
        return response
    except Exception as e:
        return jsonify({'error': str(e)}), 401
    
@app.route('/chats', methods=['GET'])
def get_chats():
    """Retrieve chats for the authenticated user."""
    user = verify_session_cookie()
    if isinstance(user, dict) and "error" in user:
        return user

    user_id = user["uid"]
    try:
        chats = get_chats_by_user_id(db=Session(), user_id=user_id)
        return jsonify(chats), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/chat', methods=['POST'])
def save_chat_route():
    """Save a new chat."""
    user = verify_session_cookie()
    if isinstance(user, dict) and "error" in user:
        return user
    user_id = user["uid"]

    data = request.json
    chat_id = data.get('id')
    title = data.get('title')

    if not chat_id or not user_id or not title:
        return jsonify({"error": "Chat ID, user ID, and title are required"}), 400

    try:
        chat = save_chat(db=Session(), user_id=user_id, title=title)
        return jsonify(chat), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/chats', methods=['DELETE'])
def delete_chat_param_missing():
    return jsonify({"error": "chat_id is required in the URL"}), 400

@app.route('/chat/<chat_id>', methods=['GET'])
def get_chat_by_id_route(chat_id):
    """Get a single chat by ID."""
    user = verify_session_cookie()
    if isinstance(user, dict) and "error" in user:
        return user

    db_session = Session()
    try:
        chat = db_session.query(Chat).filter(Chat.id == chat_id).first()
        if not chat:
            return jsonify({"error": "Chat not found"}), 404

        if str(chat.userId) != user["uid"]:
            return jsonify({"error": "Unauthorized"}), 401

        chat_data = {
            "id": str(chat.id),
            "createdAt": chat.createdAt.isoformat(),
            "title": chat.title,
            "userId": str(chat.userId),
            "visibility": chat.visibility
        }
        return jsonify(chat_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db_session.close()

@app.route('/chat/<chat_id>', methods=['DELETE'])
def delete_chat_by_id_route(chat_id):
    """Delete a chat by its ID."""
    user = verify_session_cookie()
    if isinstance(user, dict) and "error" in user:
        return user

    try:
        delete_chat_by_id(db=Session(), chat_id=chat_id)
        return jsonify({"message": "Chat and its associated messages deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": f"Error deleting chat: {str(e)}"}), 500

@app.route('/messages/<chat_id>', methods=['GET'])
def get_messages_by_chat(chat_id):
    """Retrieve messages for a specific chat."""
    user = verify_session_cookie()
    if isinstance(user, dict) and "error" in user:
        return user

    try:
        messages = get_messages_by_chat_id(db=Session(), chat_id=chat_id)
        return jsonify(messages), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/message', methods=['POST'])
def save_message():
    """Save messages for a chat."""
    user = verify_session_cookie()
    if isinstance(user, dict) and "error" in user:
        return user

    data = request.json
    messages = data.get('messages')

    if not messages:
        return jsonify({"error": "Messages are required"}), 400

    try:
        saved = save_messages(db=Session(), messages=messages)
        return jsonify(saved), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/message/vote', methods=['POST'])
def vote_on_message():
    """Vote on a message in a chat."""
    user = verify_session_cookie()
    if isinstance(user, dict) and "error" in user:
        return user

    data = request.json
    chat_id = data.get('chatId')
    message_id = data.get('messageId')
    vote_type = data.get('type')

    if not chat_id or not message_id or not vote_type:
        return jsonify({"error": "Chat ID, message ID, and vote type are required"}), 400

    try:
        vote = vote_message(db=Session(), chat_id=chat_id, message_id=message_id, vote_type=vote_type)
        return jsonify(vote), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/vote/<chat_id>', methods=['GET'])
def get_votes_for_chat(chat_id):
    """Get votes for a particular chat."""
    user = verify_session_cookie()
    if isinstance(user, dict) and "error" in user:
        return user

    try:
        votes = get_votes_by_chat_id(db=Session(), chat_id=chat_id)
        return jsonify(votes), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/documents', methods=['GET'])
def get_documents_route():
    """Get documents belonging to authenticated user."""
    user = verify_session_cookie()
    if isinstance(user, dict) and "error" in user:
        return user

    user_id = user["uid"]
    document_id = request.args.get('id')

    if not document_id:
        return jsonify({'error': 'Missing id'}), 400

    documents = get_documents_by_id(db=Session(), id=document_id)
    if not documents:
        return jsonify({'error': 'Document not found'}), 404

    if documents[0]['userId'] != user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    return jsonify(documents), 200

@app.route('/documents', methods=['POST'])
def save_document_route():
    """Save a document for the authenticated user."""
    user = verify_session_cookie()
    if isinstance(user, dict) and "error" in user:
        return user

    user_id = user["uid"]
    document_id = request.args.get('id')
    if not document_id:
        return jsonify({'error': 'Missing id'}), 400

    data = request.get_json()
    content = data.get('content')
    title = data.get('title')
    kind = data.get('kind')

    if not content or not title or not kind:
        return jsonify({'error': 'Content, title, and kind are required'}), 400

    document = save_document(
        db=Session(),
        id=document_id,
        content=content,
        title=title,
        kind=kind,
        user_id=user_id
    )

    return jsonify(document), 200

@app.route('/documents', methods=['PATCH'])
def delete_documents_by_timestamp():
    """Delete documents after a certain timestamp for the authenticated user."""
    user = verify_session_cookie()
    if isinstance(user, dict) and "error" in user:
        return user

    user_id = user["uid"]
    document_id = request.args.get('id')
    if not document_id:
        return jsonify({'error': 'Missing id'}), 400

    data = request.get_json()
    timestamp_str = data.get('timestamp')

    if not timestamp_str:
        return jsonify({'error': 'Timestamp is required'}), 400

    from datetime import datetime
    try:
        timestamp = datetime.fromisoformat(timestamp_str)
    except ValueError:
        return jsonify({'error': 'Invalid timestamp format'}), 400

    documents = get_documents_by_id(db=Session(), id=document_id)

    if not documents:
        return jsonify({'error': 'Document not found'}), 404

    if documents[0]['userId'] != user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    delete_documents_by_id_after_timestamp(
        db=Session(),
        id=document_id,
        timestamp=timestamp
    )

    return jsonify({'message': 'Documents deleted successfully'}), 200

@app.route('/document/<document_id>', methods=['GET'])
def get_document_by_id_endpoint(document_id):
    """Retrieve a single document by its ID."""
    user = verify_session_cookie()
    if isinstance(user, dict) and "error" in user:
        return user

    try:
        doc = get_document_by_id(db=Session(), document_id=document_id)
        if not doc:
            return jsonify({"error": "Document not found"}), 404

        if doc['userId'] != user["uid"]:
            return jsonify({'error': 'Unauthorized'}), 401

        return jsonify(doc), 200
    except Exception as e:
        return jsonify({"error": f"Error retrieving document: {str(e)}"}), 500

@app.route('/suggestions', methods=['GET'])
def get_suggestions_route():
    """Fetch suggestions for a specific document ID."""
    user = verify_session_cookie()
    if isinstance(user, dict) and "error" in user:
        return user

    document_id = request.args.get('documentId')
    if not document_id:
        return jsonify({"error": "Document ID is required"}), 400

    try:
        suggestions = get_suggestions_by_document_id(document_id)
        if not suggestions:
            return jsonify([]), 200

        if suggestions[0]["userId"] != user["uid"]:
            return jsonify({"error": "Unauthorized"}), 401

        return jsonify(suggestions), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/suggestions', methods=['POST'])
def save_suggestions_endpoint():
    """Save suggestions for a specific document."""
    user = verify_session_cookie()
    if isinstance(user, dict) and "error" in user:
        return user

    data = request.get_json()
    document_id = data.get('documentId')
    original_text = data.get('originalText')
    suggested_text = data.get('suggestedText')
    description = data.get('description')
    user_id = user["uid"]

    if not document_id or not original_text or not suggested_text:
        return jsonify({"error": "documentId, originalText, and suggestedText are required"}), 400

    try:
        from datetime import datetime
        suggestions = [
            Suggestion(
                documentId=document_id,
                originalText=original_text,
                suggestedText=suggested_text,
                description=description,
                userId=user_id,
                documentCreatedAt=datetime.utcnow()
            )
        ]
        db_session = Session()
        save_suggestions(db_session, suggestions)
        return jsonify({"message": "Suggestions saved successfully"}), 201
    except Exception as e:
        return jsonify({"error": f"Error saving suggestions: {str(e)}"}), 500

@app.route('/delete-trailing-messages', methods=['POST'])
def delete_trailing_messages():
    """Delete messages after a given timestamp in a chat."""
    user = verify_session_cookie()
    if isinstance(user, dict) and "error" in user:
        return user

    data = request.get_json()
    message_id = data.get('id')

    if not message_id:
        return jsonify({"error": "Message ID is required"}), 400

    msg = get_message_by_id(id=message_id)
    if not msg:
        return jsonify({"error": "Message not found"}), 404

    delete_messages_by_chat_id_after_timestamp(chatId=msg.chatId, timestamp=msg.createdAt)
    return jsonify({"message": "Trailing messages deleted"}), 200

@app.route('/update-chat-visibility', methods=['POST'])
def update_chat_visibility():
    """Update the visibility status of a chat."""
    user = verify_session_cookie()
    if isinstance(user, dict) and "error" in user:
        return user

    data = request.get_json()
    chat_id = data.get('chatId')
    visibility = data.get('visibility')

    if not chat_id or not visibility:
        return jsonify({"error": "Chat ID and visibility are required"}), 400

    update_chat_visibility_by_id(db=Session(), chat_id=chat_id, visibility=visibility)

    return jsonify({"message": "Chat visibility updated successfully"}), 200

@app.route('/save-model-id', methods=['POST'])
def save_model_id():
    """Save the selected AI model ID. Optionally protect this route."""
    user = verify_session_cookie()
    if isinstance(user, dict) and "error" in user:
        return user

    data = request.get_json()
    model_id = data.get('model')

    if not model_id:
        return jsonify({"error": "Model ID is required"}), 400

    return jsonify({"message": f"Model ID {model_id} saved successfully"}), 200

@app.route('/generate-title', methods=['POST'])
def generate_title_from_message():
    """Generate a short title from the user's first message."""
    user = verify_session_cookie()
    if isinstance(user, dict) and "error" in user:
        return user

    data = request.get_json()
    message = data.get('message')

    if not message:
        return jsonify({"error": "Message is required"}), 400

    title = message[:80]
    return jsonify({"title": title}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)

@app.route('/market', methods=['POST'])
def create_market_item():
    user = verify_session_cookie()
    if isinstance(user, dict) and "error" in user:
        return user

    data = request.get_json()
    snp500 = data.get("snp500")
    date_str = data.get("date")

    if snp500 is None or not date_str:
        return jsonify({"error": "snp500 and date are required"}), 400

    try:
        market_date = date.fromisoformat(date_str)
    except ValueError:
        return jsonify({"error": "Invalid date format (use YYYY-MM-DD)"}), 400

    db_session = Session()
    try:
        new_item = save_market_item(
            db=db_session,
            snp500=snp500,
            date_value=market_date
        )
        return jsonify({
            "id": str(new_item.id),
            "snp500": float(new_item.snp500),
            "date": new_item.date.isoformat()
        }), 201
    except Exception as e:
        db_session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db_session.close()


@app.route('/market/recent', methods=['GET'])
def get_recent_market_data():
    user = verify_session_cookie()
    if isinstance(user, dict) and "error" in user:
        return user

    limit_count = request.args.get("limit", default=30, type=int)

    db_session = Session()
    try:
        results = get_recent_market_prices(db_session, limit_count=limit_count)
        return jsonify([
            {
                "price": float(item.snp500),
                "date": item.date.isoformat()
            }
            for item in results
        ]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db_session.close()


@app.route('/market/<market_id>', methods=['GET'])
def get_single_market_item(market_id):
    user = verify_session_cookie()
    if isinstance(user, dict) and "error" in user:
        return user

    db_session = Session()
    try:
        item = get_market_item_by_id(db_session, market_id)
        if not item:
            return jsonify({"error": "Market item not found"}), 404

        return jsonify({
            "id": str(item[0].id) if isinstance(item, list) else str(item.id),
            "snp500": float(item[0].snp500) if isinstance(item, list) else float(item.snp500),
            "date": (item[0].date.isoformat()
                     if isinstance(item, list)
                     else item.date.isoformat())
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db_session.close()


@app.route('/market/<market_id>', methods=['DELETE'])
def remove_market_item(market_id):
    user = verify_session_cookie()
    if isinstance(user, dict) and "error" in user:
        return user

    db_session = Session()
    try:
        delete_market_item_by_id(db_session, market_id)
        return jsonify({"message": "Market item deleted"}), 200
    except Exception as e:
        db_session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db_session.close()

@app.route('/news', methods=['POST'])
def create_news_item():
    user = verify_session_cookie()
    if isinstance(user, dict) and "error" in user:
        return user

    data = request.get_json()
    title = data.get("title")
    subject = data.get("subject")
    link = data.get("link")

    if not title or not subject or not link:
        return jsonify({"error": "title, subject, and link are required"}), 400

    db_session = Session()
    try:
        new_article = save_news_item(
            db=db_session,
            title=title,
            subject=subject,
            link=link
        )
        return jsonify({
            "id": str(new_article.id),
            "title": new_article.title,
            "subject": new_article.subject,
            "link": new_article.link
        }), 201
    except Exception as e:
        db_session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db_session.close()


@app.route('/news', methods=['GET'])
def get_all_news_items():
    user = verify_session_cookie()
    if isinstance(user, dict) and "error" in user:
        return user

    db_session = Session()
    try:
        articles = get_all_news(db_session)
        return jsonify([
            {
                "id": str(a.id),
                "title": a.title,
                "subject": a.subject,
                "link": a.link
            }
            for a in articles
        ]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db_session.close()


@app.route('/news/<news_id>', methods=['GET'])
def get_news_item_by_id(news_id):
    user = verify_session_cookie()
    if isinstance(user, dict) and "error" in user:
        return user

    db_session = Session()
    try:
        article = get_news_by_id(db_session, news_id)
        if not article:
            return jsonify({"error": "News article not found"}), 404
        item = article[0] if isinstance(article, list) else article
        return jsonify({
            "id": str(item.id),
            "title": item.title,
            "subject": item.subject,
            "link": item.link
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db_session.close()


@app.route('/news/<news_id>', methods=['DELETE'])
def remove_news_item(news_id):
    user = verify_session_cookie()
    if isinstance(user, dict) and "error" in user:
        return user

    db_session = Session()
    try:
        delete_news_by_id(db_session, news_id)
        return jsonify({"message": "News article deleted"}), 200
    except Exception as e:
        db_session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db_session.close()