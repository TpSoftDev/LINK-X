from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    Boolean,
    ForeignKey,
    UniqueConstraint,
    Numeric,
    Date,
    Text
)
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.dialects.postgresql import UUID, BYTEA, ENUM, JSONB
from pgvector.sqlalchemy import Vector
import uuid
from datetime import datetime

Base = declarative_base()

role_enum = ENUM('admin', 'instructor', 'student', name='role_enum', create_type=False)

class User(Base):
    __tablename__ = 'User'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(64), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    firebase_uid = Column(String(128))

    role = relationship('Role', back_populates='user', uselist=False)
    instructor_profile = relationship('InstructorProfile', back_populates='user', uselist=False)
    student_profile = relationship('StudentProfile', back_populates='user', uselist=False)
    admin_profile = relationship('AdminProfile', back_populates='user', uselist=False)

class Role(Base):
    __tablename__ = 'Role'
    user_id = Column(UUID(as_uuid=True),
                     ForeignKey('User.id', ondelete='CASCADE'),
                     primary_key=True)
    role_type = Column(role_enum, nullable=False)

    user = relationship('User', back_populates='role')

class InstructorProfile(Base):
    __tablename__ = 'InstructorProfile'
    user_id = Column(UUID(as_uuid=True),
                     ForeignKey('User.id', ondelete='CASCADE'),
                     primary_key=True)
    name = Column(Text, nullable=False)
    university = Column(String(128))

    user = relationship('User', back_populates='instructor_profile')
    courses = relationship('Course', back_populates='instructor_profile')

class StudentProfile(Base):
    __tablename__ = 'StudentProfile'
    user_id = Column(UUID(as_uuid=True),
                     ForeignKey('User.id', ondelete='CASCADE'),
                     primary_key=True)
    name = Column(Text, nullable=False)
    onboard_answers = Column(JSONB, nullable=False)
    want_quizzes = Column(Boolean, nullable=False, default=False)
    model_preference = Column(String(64), nullable=True)

    user = relationship('User', back_populates='student_profile')
    enrollments = relationship('Enrollment', back_populates='student')
    chats = relationship('Chat', back_populates='student')
    personalized_files = relationship('PersonalizedFile', back_populates='student')

class AdminProfile(Base):
    __tablename__ = 'AdminProfile'
    user_id = Column(UUID(as_uuid=True),
                     ForeignKey('User.id', ondelete='CASCADE'),
                     primary_key=True)
    name = Column(Text, nullable=False)

    user = relationship('User', back_populates='admin_profile')

class Course(Base):
    __tablename__ = 'Course'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(128), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    index_pkl = Column(BYTEA)
    index_faiss = Column(BYTEA)
    instructor_id = Column(UUID(as_uuid=True),
                           ForeignKey('InstructorProfile.user_id', ondelete='CASCADE'),
                           nullable=False)

    instructor_profile = relationship('InstructorProfile', back_populates='courses')
    modules = relationship('Module', back_populates='course')
    access_code = relationship('AccessCode', back_populates='course', uselist=False)
    enrollments = relationship('Enrollment', back_populates='course')
    reports = relationship('Report', back_populates='course')

class Module(Base):
    __tablename__ = 'Module'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True),
                       ForeignKey('Course.id', ondelete='CASCADE'),
                       nullable=False)
    title = Column(String(128), nullable=False)

    course = relationship('Course', back_populates='modules')
    files = relationship('File', back_populates='module')

class File(Base):
    __tablename__ = 'File'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id = Column(UUID(as_uuid=True),
                       ForeignKey('Module.id', ondelete='CASCADE'),
                       nullable=False)
    title = Column(String(128), nullable=False)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    file_data = Column(BYTEA, nullable=False)
    transcription = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    module = relationship('Module', back_populates='files')
    chats = relationship('Chat', back_populates='file')
    personalized_files = relationship('PersonalizedFile', back_populates='original_file')

class FileChunk(Base):
    __tablename__ = 'FileChunk'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(1536), nullable=False)
    file_id = Column(UUID(as_uuid=True),
                     ForeignKey('File.id', ondelete='CASCADE'),
                     nullable=False)
    course_id = Column(UUID(as_uuid=True),
                       ForeignKey('Course.id', ondelete='CASCADE'),
                       nullable=False)
    chunk_index = Column(Integer, nullable=False)

    __table_args__ = (
        UniqueConstraint('file_id', 'chunk_index', name='uq_filechunk_file_index'),
    )

    file = relationship('File')
    course = relationship('Course')

class AccessCode(Base):
    __tablename__ = 'AccessCode'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(32), nullable=False, unique=True)
    course_id = Column(UUID(as_uuid=True),
                       ForeignKey('Course.id', ondelete='CASCADE'),
                       nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    course = relationship('Course', back_populates='access_code')

class Enrollment(Base):
    __tablename__ = 'Enrollment'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True),
                     ForeignKey('StudentProfile.user_id', ondelete='CASCADE'),
                     nullable=False)
    course_id = Column(UUID(as_uuid=True),
                       ForeignKey('Course.id', ondelete='CASCADE'),
                       nullable=False)
    enrolled_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('user_id', 'course_id', name='uq_enrollment_student_course'),
    )

    student = relationship('StudentProfile', back_populates='enrollments', foreign_keys=[user_id])
    course = relationship('Course', back_populates='enrollments')

class PersonalizedFile(Base):
    __tablename__ = 'PersonalizedFile'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True),
                     ForeignKey('StudentProfile.user_id', ondelete='CASCADE'),
                     nullable=False)
    original_file_id = Column(UUID(as_uuid=True),
                              ForeignKey('File.id', ondelete='SET NULL'),
                              nullable=True)
    content = Column(JSONB, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    student = relationship('StudentProfile', back_populates='personalized_files', foreign_keys=[user_id])
    original_file = relationship('File', back_populates='personalized_files')

class Chat(Base):
    __tablename__ = 'Chat'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True),
                     ForeignKey('StudentProfile.user_id', ondelete='CASCADE'),
                     nullable=False)
    file_id = Column(UUID(as_uuid=True),
                     ForeignKey('File.id', ondelete='SET NULL'),
                     nullable=True)
    title = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    student = relationship('StudentProfile', back_populates='chats', foreign_keys=[user_id])
    file = relationship('File', back_populates='chats')
    messages = relationship('Message', back_populates='chat')

class Message(Base):
    __tablename__ = 'Message'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id = Column(UUID(as_uuid=True),
                     ForeignKey('Chat.id', ondelete='CASCADE'),
                     nullable=False)
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    chat = relationship('Chat', back_populates='messages')

class Report(Base):
    __tablename__ = 'Report'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True),
                       ForeignKey('Course.id', ondelete='CASCADE'),
                       nullable=False)
    summary = Column(JSONB, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    course = relationship('Course', back_populates='reports')

class Market(Base):
    __tablename__ = 'Market'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    snp500 = Column(Numeric, nullable=False)
    date = Column(Date, nullable=False)

class News(Base):
    __tablename__ = 'News'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(64), nullable=False)
    subject = Column(String(64), nullable=False)
    link = Column(String(120), nullable=False)