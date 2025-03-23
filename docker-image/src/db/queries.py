from sqlalchemy import select, and_, desc, asc
from sqlalchemy.orm import Session
from src.db.schema import User, Chat, Message, Vote, Document, Suggestion, Onboarding, News, Market
from werkzeug.security import generate_password_hash, check_password_hash
from typing import Optional
from datetime import date
import uuid

# Get User by Email
def get_user_by_email(db: Session, email: str):
    """Retrieve a user by email from the database."""
    try:
        result = db.execute(select(User).filter_by(email=email)).scalars().first()
        return result
    except Exception as e:
        print(f"Error retrieving user: {e}")
        raise

# Create a User
def create_user(db: Session, email: str, password: str):
    try:
        hashed_password = generate_password_hash(password)  # Hash the password
        new_user = User(email=email, password=hashed_password)
        db.add(new_user)
        db.commit()
        return new_user
    except Exception as e:
        print(f"Error creating user: {e}")
        raise

# Save Chat
def save_chat(db: Session, user_id: str, title: str):
    """Save a chat in the database."""
    try:
        new_chat = Chat(userId=user_id, title=title)
        db.add(new_chat)
        db.commit()
        return new_chat
    except Exception as e:
        print(f"Error saving chat: {e}")
        raise

# Delete Chat by ID
def delete_chat_by_id(db: Session, chat_id: str):
    """Delete a chat and its associated messages and votes."""
    try:
        db.query(Vote).filter(Vote.chat_id == chat_id).delete()
        db.query(Message).filter(Message.chat_id == chat_id).delete()
        db.query(Chat).filter(Chat.id == chat_id).delete()
        db.commit()
    except Exception as e:
        print(f"Error deleting chat: {e}")
        raise

# Get Chats by User ID
def get_chats_by_user_id(db: Session, user_id: str):
    """Retrieve all chats for a user, ordered by creation date."""
    try:
        return db.execute(select(Chat).filter_by(userId=user_id).order_by(desc(Chat.createdAt))).scalars().all()
    except Exception as e:
        print(f"Error retrieving chats by user: {e}")
        raise

# Get Chat by ID
def get_chat_by_id(db: Session, chat_id: str):
    """Retrieve a single chat by its ID."""
    try:
        return db.execute(select(Chat).filter_by(id=chat_id)).scalars().first()
    except Exception as e:
        print(f"Error retrieving chat: {e}")
        raise

# Save Messages
def save_messages(db: Session, messages: list):
    """Save multiple messages to the database."""
    try:
        db.add_all(messages)
        db.commit()
    except Exception as e:
        print(f"Error saving messages: {e}")
        raise

# Get Messages by Chat ID
def get_messages_by_chat_id(db: Session, chat_id: str):
    """Retrieve all messages in a chat, ordered by creation date."""
    try:
        return db.execute(select(Message).filter_by(chatId=chat_id).order_by(asc(Message.createdAt))).scalars().all()
    except Exception as e:
        print(f"Error retrieving messages by chat ID: {e}")
        raise

# Vote on a Message
def vote_message(db: Session, chat_id: str, message_id: str, vote_type: str):
    """Upvote or downvote a message."""
    try:
        existing_vote = db.execute(select(Vote).filter_by(messageId=message_id)).scalars().first()

        if existing_vote:
            existing_vote.is_upvoted = vote_type == 'up'
            db.commit()
        else:
            new_vote = Vote(chatId=chat_id, messageId=message_id, isUpvoted=(vote_type == 'up'))
            db.add(new_vote)
            db.commit()
    except Exception as e:
        print(f"Error voting on message: {e}")
        raise

# Get Votes by Chat ID
def get_votes_by_chat_id(db: Session, chat_id: str):
    """Retrieve all votes for a specific chat."""
    try:
        return db.execute(select(Vote).filter_by(chatId=chat_id)).scalars().all()
    except Exception as e:
        print(f"Error retrieving votes by chat ID: {e}")
        raise

# Save Document
def save_document(db: Session, user_id: str, title: str, kind: str, content: str):
    """Save a document in the database."""
    try:
        new_document = Document(userId=user_id, title=title, kind=kind, content=content)
        db.add(new_document)
        db.commit()
        return new_document
    except Exception as e:
        print(f"Error saving document: {e}")
        raise

# Get Documents by ID
def get_documents_by_id(db: Session, document_id: str):
    """Retrieve all versions of a document by its ID."""
    try:
        return db.execute(select(Document).filter_by(id=document_id).order_by(asc(Document.createdAt))).scalars().all()
    except Exception as e:
        print(f"Error retrieving documents by ID: {e}")
        raise

# Get Document by ID
def get_document_by_id(db: Session, document_id: str):
    """Retrieve a single document by its ID."""
    try:
        return db.execute(select(Document).filter_by(id=document_id).order_by(desc(Document.createdAt))).scalars().first()
    except Exception as e:
        print(f"Error retrieving document: {e}")
        raise

# Delete Documents by ID After Timestamp
def delete_documents_by_id_after_timestamp(db: Session, document_id: str, timestamp: str):
    """Delete documents by ID after a specific timestamp."""
    try:
        db.query(Suggestion).filter(and_(Suggestion.documentId == document_id, Suggestion.createdAt > timestamp)).delete()
        db.query(Document).filter(and_(Document.id == document_id, Document.createdAt > timestamp)).delete()
        db.commit()
    except Exception as e:
        print(f"Error deleting documents: {e}")
        raise

# Save Suggestions
def save_suggestions(db: Session, suggestions: list):
    """Save multiple suggestions to the database."""
    try:
        db.add_all(suggestions)
        db.commit()
    except Exception as e:
        print(f"Error saving suggestions: {e}")
        raise

# Get Suggestions by Document ID
def get_suggestions_by_document_id(db: Session, document_id: str):
    """Retrieve all suggestions for a document."""
    try:
        return db.execute(select(Suggestion).filter_by(documentId=document_id)).scalars().all()
    except Exception as e:
        print(f"Error retrieving suggestions by document ID: {e}")
        raise

# Get Message by ID
def get_message_by_id(db: Session, message_id: str):
    """Retrieve a message by its ID."""
    try:
        return db.execute(select(Message).filter_by(id=message_id)).scalars().first()
    except Exception as e:
        print(f"Error retrieving message: {e}")
        raise

# Delete Messages by Chat ID After Timestamp
def delete_messages_by_chat_id_after_timestamp(db: Session, chat_id: str, timestamp: str):
    """Delete messages from a chat after a specific timestamp."""
    try:
        db.query(Message).filter(and_(Message.chatId == chat_id, Message.createdAt >= timestamp)).delete()
        db.commit()
    except Exception as e:
        print(f"Error deleting messages: {e}")
        raise

# Update Chat Visibility
def update_chat_visibility_by_id(db: Session, chat_id: str, visibility: str):
    """Update the visibility of a chat."""
    try:
        chat = db.execute(select(Chat).filter_by(id=chat_id)).scalars().first()
        if chat:
            chat.visibility = visibility
            db.commit()
            return chat
        else:
            print(f"Chat with ID {chat_id} not found.")
            raise Exception("Chat not found")
    except Exception as e:
        print(f"Error updating chat visibility: {e}")
        raise

def create_onboarding(
    db: Session,
    user_id: str,
    name: str,
    job: Optional[str] = None,
    traits: Optional[str] = None,
    learningStyle: Optional[str] = None,
    depth: Optional[str] = None,
    topics: Optional[str] = None,
    interests: Optional[str] = None,
    schedule: Optional[str] = None,
    quizzes: bool = False
) -> Onboarding:
    """Create a new onboarding record."""
    try:
        onboarding_record = Onboarding(
            userId=user_id,
            name=name,
            job=job,
            traits=traits,
            learningStyle=learningStyle,
            depth=depth,
            topics=topics,
            interests=interests,
            schedule=schedule,
            quizzes=quizzes,
        )
        db.add(onboarding_record)
        db.commit()
        db.refresh(onboarding_record)
        return onboarding_record
    except Exception as e:
        print("Error creating onboarding record:", e)
        db.rollback()
        raise e
    
def save_market_item(db: Session, snp500: float, date_value: date) -> Market:
    """Insert a new record into the Market table."""
    try:
        new_market = Market(
            id=uuid.uuid4(),
            snp500=snp500,
            date=date_value
        )
        db.add(new_market)
        db.commit()
        db.refresh(new_market)
        return new_market
    except Exception as e:
        db.rollback()
        print("Error saving market item:", e)
        raise

def get_recent_market_prices(db: Session, limit_count: int = 30):
    """
    Retrieve the most recent market prices (by date).
    Defaults to the last 30 entries.
    """
    try:
        stmt = (
            select(Market)
            .order_by(asc(Market.date))
            .limit(limit_count)
        )
        return db.execute(stmt).scalars().all()
    except Exception as e:
        print("Error retrieving recent market prices:", e)
        raise

def get_market_item_by_id(db: Session, market_id: str) -> Market:
    """Retrieve a Market record by its UUID."""
    try:
        stmt = select(Market).where(Market.id == market_id)
        return db.execute(stmt).scalars().first()
    except Exception as e:
        print("Error retrieving market item by ID:", e)
        raise

def delete_market_item_by_id(db: Session, market_id: str):
    """Delete a Market record by its UUID."""
    try:
        target = db.query(Market).filter(Market.id == market_id).first()
        if target:
            db.delete(target)
            db.commit()
    except Exception as e:
        db.rollback()
        print("Error deleting market item:", e)
        raise

def save_news_item(db: Session, title: str, subject: str, link: str) -> News:
    """Insert a new record into the News table."""
    try:
        new_news = News(
            id=uuid.uuid4(),
            title=title,
            subject=subject,
            link=link
        )
        db.add(new_news)
        db.commit()
        db.refresh(new_news)
        return new_news
    except Exception as e:
        db.rollback()
        print("Error saving news item:", e)
        raise

def get_all_news(db: Session):
    """Retrieve all records from the News table."""
    try:
        stmt = select(News)
        return db.execute(stmt).scalars().all()
    except Exception as e:
        print("Error retrieving all news:", e)
        raise

def get_news_by_id(db: Session, news_id: str) -> News:
    """Retrieve a single News record by its UUID."""
    try:
        stmt = select(News).where(News.id == news_id)
        return db.execute(stmt).scalars().first()
    except Exception as e:
        print("Error retrieving news by ID:", e)
        raise

def delete_news_by_id(db: Session, news_id: str):
    """Delete a News record by its UUID."""
    try:
        target = db.query(News).filter(News.id == news_id).first()
        if target:
            db.delete(target)
            db.commit()
    except Exception as e:
        db.rollback()
        print("Error deleting news item:", e)
        raise