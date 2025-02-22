from sqlalchemy import create_engine, Column, String, Integer, DateTime, ForeignKey, Boolean, Enum, Text
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

Base = declarative_base()

# User model
class User(Base):
    __tablename__ = 'User'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(64), nullable=False, unique=True)
    password = Column(String(64))

    # relationships
    chats = relationship("Chat", back_populates="user")
    documents = relationship("Document", back_populates="user")
    suggestions = relationship("Suggestion", back_populates="user")

# Chat model
class Chat(Base):
    __tablename__ = 'Chat'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    createdAt = Column(DateTime, nullable=False, default=datetime.utcnow)
    title = Column(Text, nullable=False)
    userId = Column(UUID(as_uuid=True), ForeignKey('User.id'), nullable=False)
    visibility = Column(Enum('public', 'private', name='visibility'), default='private', nullable=False)

    # relationships
    user = relationship("User", back_populates="chats")
    messages = relationship("Message", back_populates="chat")
    votes = relationship("Vote", back_populates="chat")

# Message model
class Message(Base):
    __tablename__ = 'Message'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chatId = Column(UUID(as_uuid=True), ForeignKey('Chat.id'), nullable=False)
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)  # Use a plain string for the content field
    createdAt = Column(DateTime, nullable=False, default=datetime.utcnow)

    # relationships
    chat = relationship("Chat", back_populates="messages")
    votes = relationship("Vote", back_populates="message")

# Vote model
class Vote(Base):
    __tablename__ = 'Vote'

    chatId = Column(UUID(as_uuid=True), ForeignKey('Chat.id'), primary_key=True)
    messageId = Column(UUID(as_uuid=True), ForeignKey('Message.id'), primary_key=True)
    isUpvoted = Column(Boolean, nullable=False)

    # relationships
    chat = relationship("Chat", back_populates="votes")
    message = relationship("Message", back_populates="votes")

# Document model
class Document(Base):
    __tablename__ = 'Document'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    createdAt = Column(DateTime, nullable=False, default=datetime.utcnow)
    title = Column(Text, nullable=False)
    content = Column(Text)
    kind = Column(Enum('text', 'code', name='document_kind'), default='text', nullable=False)
    userId = Column(UUID(as_uuid=True), ForeignKey('User.id'), nullable=False)

    # relationships
    user = relationship("User", back_populates="documents")
    suggestions = relationship("Suggestion", back_populates="document")

# Suggestion model
class Suggestion(Base):
    __tablename__ = 'Suggestion'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    documentId = Column(UUID(as_uuid=True), ForeignKey('Document.id'), nullable=False)
    documentCreatedAt = Column(DateTime, nullable=False)
    originalText = Column(Text, nullable=False)
    suggestedText = Column(Text, nullable=False)
    description = Column(Text)
    isResolved = Column(Boolean, default=False, nullable=False)
    userId = Column(UUID(as_uuid=True), ForeignKey('User.id'), nullable=False)
    createdAt = Column(DateTime, nullable=False, default=datetime.utcnow)

    # relationships
    document = relationship("Document", back_populates="suggestions")
    user = relationship("User", back_populates="suggestions")
