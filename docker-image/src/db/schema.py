from sqlalchemy import create_engine, Column, String, Integer, DateTime, ForeignKey, Boolean, Enum, Text, Numeric, Date
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.dialects.postgresql import UUID, JSONB

import uuid
from datetime import datetime

Base = declarative_base()

# User model
class User(Base):
    __tablename__ = 'User'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(64), nullable=False, unique=True)
    password = Column(String(255))
    firebase_uid = Column(String(128), nullable=True)  # New field

    # relationships
    chats = relationship("Chat", back_populates="user")
    documents = relationship("Document", back_populates="user")
    suggestions = relationship("Suggestion", back_populates="user")
    onboarding = relationship("Onboarding", back_populates="user", uselist=False)

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
    content = Column(Text, nullable=False)
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

# Onboarding model
class Onboarding(Base):
    __tablename__ = 'Onboarding'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    userId = Column(
        UUID(as_uuid=True),
        ForeignKey('User.id', ondelete='CASCADE'),
        nullable=False
    )
    name = Column(Text, nullable=False)
    # New column to store all quiz answers as a list in JSONB format.
    answers = Column(JSONB, nullable=False)
    quizzes = Column(Boolean, nullable=False, default=False)
    createdAt = Column(DateTime, nullable=False, default=datetime.utcnow)

    # relationships
    user = relationship("User", back_populates="onboarding")

# Market model
class Market(Base):
    __tablename__ = 'Market'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    snp500 = Column(Numeric, nullable=False)
    date = Column(Date, nullable=False)

# News model
class News(Base):
    __tablename__ = 'News'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(64), nullable=False)
    subject = Column(String(64), nullable=False)
    link = Column(String(120), nullable=False)

# Course model
class Course(Base):
    __tablename__ = 'courses'

    id = Column(Integer, primary_key=True, autoincrement=True)
    course_name = Column(Text, nullable=False)
    course_description = Column(Text)
    author = Column(Text)
    pdf = Column(Text)
    expertise = Column(Text)
    est_time = Column(Text)
    user = Column(String(120))