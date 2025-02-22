from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import faiss
import pickle
import numpy as np
from dotenv import load_dotenv
import os
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db.schema import Base
from alembic import command
from alembic.config import Config
import traceback
import bcrypt
import jwt
import datetime
from werkzeug.security import check_password_hash

from src.db.queries import (
    get_user_by_email, create_user, save_chat, delete_chat_by_id, get_chats_by_user_id,
    get_chat_by_id, save_messages, get_messages_by_chat_id, vote_message,
    get_votes_by_chat_id, save_document, get_documents_by_id, get_document_by_id,
    delete_documents_by_id_after_timestamp, save_suggestions, get_suggestions_by_document_id,
    get_message_by_id, delete_messages_by_chat_id_after_timestamp, update_chat_visibility_by_id
)

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# File paths for FAISS index and metadata
INDEX_PATH = "/app/"
PICKLE_PATH = "/app/"

# SQLAlchemy configuration
POSTGRES_URL = os.getenv("POSTGRES_URL")
if not POSTGRES_URL:
    raise ValueError("POSTGRES_URL is not defined in the environment")

# Create database engine and session
engine = create_engine(POSTGRES_URL)
Session = sessionmaker(bind=engine)

# Create tables (you can remove this if Alembic handles migrations)
Base.metadata.create_all(engine)

# Load FAISS index
try:
    faiss_index = faiss.read_index("/app/index.faiss")
    print(f"FAISS index successfully loaded from /app/index.faiss")
except Exception as e:
    print(f"Error loading FAISS index: {e}")
    faiss_index = None

# Load metadata
try:
    with open("/app/index.pkl", "rb") as f:
        metadata = pickle.load(f)
    print(f"Metadata successfully loaded from /app/index.pkl")
except Exception as e:
    print(f"Error loading metadata: {e}")
    metadata = None

@app.route('/')
def home():
    """Serve the main UI."""
    return render_template('index.html')  # Ensure index.html exists in /templates directory


@app.route('/user', methods=['GET'])
def get_user():
    """Get user by email."""
    email = request.args.get('email')
    if email:
        try:
            user_data = get_user_by_email(db=Session(), email=email)
            return jsonify(user_data), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    return jsonify({"error": "Email is required"}), 400


@app.route('/user', methods=['POST'])
def create_user_route():
    """Create a new user."""
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    try:
        user = create_user(db=Session(), email=email, password=password)
        return jsonify(user), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Validate input
    if not email or not password:
        return jsonify({'error': 'Invalid data'}), 400

    # Fetch user from the database
    user = get_user_by_email(db=Session(), email=email)  # Corrected function reference
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Check password (assuming you store hashed passwords in the DB)
    if not check_password_hash(user['password'], password):
        return jsonify({'error': 'Invalid credentials'}), 401

    # Create JWT token
    token = jwt.encode({
        'id': user['id'],
        'email': user['email'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }, app.config['SECRET_KEY'], algorithm='HS256')

    return jsonify({'token': token}), 200


@app.route('/api/refresh-token', methods=['POST'])
def refresh_token():
    token = request.get_json().get('token')
    try:
        decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        new_token = jwt.encode({
            'id': decoded['id'],
            'email': decoded['email'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        return jsonify({'token': new_token}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    

@app.route('/chat', methods=['POST'])
def save_chat_route():
    """Save a new chat."""
    data = request.json
    chat_id = data.get('id')
    user_id = data.get('userId')
    title = data.get('title')

    if not chat_id or not user_id or not title:
        return jsonify({"error": "Chat ID, user ID, and title are required"}), 400

    try:
        chat = save_chat(db=Session(), user_id=user_id, title=title)  # Corrected reference to save_chat
        return jsonify(chat), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/chats', methods=['GET'])
def get_chats_by_user():
    """Get chats for a specific user."""
    user_id = request.args.get('userId')
    if user_id:
        try:
            chats = get_chats_by_user_id(db=Session(), user_id=user_id)  # Corrected reference to get_chats_by_user_id
            return jsonify(chats), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    return jsonify({"error": "User ID is required"}), 400


@app.route('/chat/<chat_id>', methods=['GET'])
def get_chat_by_id_route(chat_id):
    """Get chat by ID."""
    try:
        chat = get_chat_by_id(db=Session(), chat_id=chat_id)  # Corrected reference to get_chat_by_id
        return jsonify(chat), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/message', methods=['POST'])
def save_message():
    """Save messages for a chat."""
    data = request.json
    messages = data.get('messages')

    if not messages:
        return jsonify({"error": "Messages are required"}), 400

    try:
        saved_messages = save_messages(db=Session(), messages=messages)  # Corrected reference to save_messages
        return jsonify(saved_messages), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/messages/<chat_id>', methods=['GET'])
def get_messages_by_chat(chat_id):
    """Get messages for a chat by ID."""
    try:
        messages = get_messages_by_chat_id(db=Session(), chat_id=chat_id)  # Corrected reference to get_messages_by_chat_id
        return jsonify(messages), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/message/vote', methods=['POST'])
def vote_on_message():
    """Vote on a message in a chat."""
    data = request.json
    chat_id = data.get('chatId')
    message_id = data.get('messageId')
    vote_type = data.get('type')

    if not chat_id or not message_id or not vote_type:
        return jsonify({"error": "Chat ID, message ID, and vote type are required"}), 400

    try:
        vote = vote_message(db=Session(), chat_id=chat_id, message_id=message_id, vote_type=vote_type)  # Fixed function call
        return jsonify(vote), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/vote/<chat_id>', methods=['GET'])
def get_votes_by_chat(chat_id):
    """Get all votes for a chat."""
    try:
        votes = get_votes_by_chat_id(db=Session(), chat_id=chat_id)  # Corrected function reference
        return jsonify(votes), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/citations', methods=['GET'])
def citations():
    """
    Generate APA citations for the documents in the FAISS index.
    This example uses mock data or specific logic from your citation generation scripts.
    """
    try:
        citation_data = []
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
    """
    Run Alembic migrations.
    """
    try:
        alembic_cfg = Config("alembic.ini")
        alembic_cfg.set_main_option("sqlalchemy.url", POSTGRES_URL)
        
        print("⏳ Running migrations...")
        command.upgrade(alembic_cfg, "head")
        print("✅ Migrations completed.")
        
        return jsonify({"message": "Migrations completed successfully!"}), 200
    except Exception as e:
        return jsonify({"error": f"Error running migrations: {str(e)}"}), 500


@app.route('/api/save-model-id', methods=['POST'])
def save_model_id():
    """Save the selected AI model ID."""
    data = request.get_json()
    model_id = data.get('model')

    if not model_id:
        return jsonify({"error": "Model ID is required"}), 400

    # In a real setup, save this to a database or user session
    return jsonify({"message": f"Model ID {model_id} saved successfully"}), 200


@app.route('/api/generate-title', methods=['POST'])
def generate_title_from_message():
    """Generate a short title based on the user's first message."""
    data = request.get_json()
    message = data.get('message')

    if not message:
        return jsonify({"error": "Message is required"}), 400

    # Simulate AI-based title generation (replace with actual AI call if needed)
    title = message[:80]  # Truncate to 80 characters
    return jsonify({"title": title}), 200


@app.route('/api/delete-trailing-messages', methods=['POST'])
def delete_trailing_messages():
    """Delete messages after a given timestamp in a chat."""
    data = request.get_json()
    message_id = data.get('id')

    if not message_id:
        return jsonify({"error": "Message ID is required"}), 400

    # Find the message
    message = get_message_by_id(id=message_id)
    if not message:
        return jsonify({"error": "Message not found"}), 404

    # Remove messages created after this message's timestamp
    delete_messages_by_chat_id_after_timestamp(chatId=message.chatId, timestamp=message.createdAt)

    return jsonify({"message": "Trailing messages deleted"}), 200


@app.route('/api/update-chat-visibility', methods=['POST'])
def update_chat_visibility():
    """Update the visibility status of a chat."""
    data = request.get_json()
    chat_id = data.get('chatId')
    visibility = data.get('visibility')

    if not chat_id or not visibility:
        return jsonify({"error": "Chat ID and visibility are required"}), 400

    update_chat_visibility_by_id(chatId=chat_id, visibility=visibility)

    return jsonify({"message": "Chat visibility updated successfully"}), 200

@app.route('/suggestions', methods=['GET'])
def get_suggestions():
    """Fetch suggestions for a specific document ID."""
    document_id = request.args.get('documentId')

    if not document_id:
        return jsonify({"error": "Document ID is required"}), 400

    try:
        suggestions = get_suggestions_by_document_id(document_id)

        if not suggestions:
            return jsonify([]), 200  # Return an empty array if no suggestions found

        # Assuming suggestions have a userId field for ownership check
        session_user_id = request.headers.get("X-User-Id")  # Example: Use auth headers

        if suggestions[0]["userId"] != session_user_id:
            return jsonify({"error": "Unauthorized"}), 401

        return jsonify(suggestions), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/documents', methods=['GET'])
def get_documents():
    document_id = request.args.get('id')
    
    if not document_id:
        return jsonify({'error': 'Missing id'}), 400

    user_id = request.args.get('userId')
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400

    documents = get_documents_by_id(db=Session(), id=document_id)
    
    if not documents:
        return jsonify({'error': 'Document not found'}), 404

    document = documents[0]
    
    if document['userId'] != user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    return jsonify(documents), 200


@app.route('/documents', methods=['POST'])
def save_document_route():
    document_id = request.args.get('id')
    if not document_id:
        return jsonify({'error': 'Missing id'}), 400

    user_id = request.args.get('userId')
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400

    data = request.get_json()
    content = data.get('content')
    title = data.get('title')
    kind = data.get('kind')

    if not content or not title or not kind:
        return jsonify({'error': 'Content, title, and kind are required'}), 400

    # Save the document with the provided user ID
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
    document_id = request.args.get('id')
    if not document_id:
        return jsonify({'error': 'Missing id'}), 400

    user_id = request.args.get('userId')
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400

    data = request.get_json()
    timestamp = data.get('timestamp')

    if not timestamp:
        return jsonify({'error': 'Timestamp is required'}), 400

    try:
        timestamp = datetime.fromisoformat(timestamp)
    except ValueError:
        return jsonify({'error': 'Invalid timestamp format'}), 400

    documents = get_documents_by_id(db=Session(), id=document_id)

    if not documents:
        return jsonify({'error': 'Document not found'}), 404

    document = documents[0]

    if document['userId'] != user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    # Delete documents created after the given timestamp
    delete_documents_by_id_after_timestamp(
        db=Session(),
        id=document_id,
        timestamp=timestamp
    )

    return jsonify({'message': 'Documents deleted successfully'}), 200




if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)