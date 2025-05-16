CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE role_enum AS ENUM (
  'admin',
  'instructor',
  'student'
);

CREATE TABLE IF NOT EXISTS "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" VARCHAR(64) NOT NULL UNIQUE,
  "password" VARCHAR(255) NOT NULL,
  "firebase_uid" VARCHAR(128)
);

CREATE TABLE IF NOT EXISTS "Role" (
  "user_id" UUID PRIMARY KEY,
  "role_type" role_enum NOT NULL,
  CONSTRAINT fk_role_user FOREIGN KEY("user_id") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "InstructorProfile" (
  "user_id" UUID PRIMARY KEY,
  "name" TEXT NOT NULL,
  "university" VARCHAR(128),
  CONSTRAINT fk_instructor_user FOREIGN KEY("user_id") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "StudentProfile" (
  "user_id" UUID PRIMARY KEY,
  "name" TEXT NOT NULL,
  "onboard_answers" JSONB   NOT NULL,
  "want_quizzes" BOOLEAN NOT NULL DEFAULT FALSE,
  "model_preference" VARCHAR(64),
  CONSTRAINT fk_student_user FOREIGN KEY("user_id") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "AdminProfile" (
  "user_id" UUID PRIMARY KEY,
  "name" TEXT NOT NULL,
  CONSTRAINT fk_admin_user FOREIGN KEY("user_id") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Course" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" VARCHAR(128) NOT NULL,
  "description" TEXT,
  "code" VARCHAR(20),        
  "term" VARCHAR(30),
  "published" BOOLEAN NOT NULL DEFAULT false,
  "last_updated" TIMESTAMP NOT NULL DEFAULT now(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "index_pkl" BYTEA,
  "index_faiss" BYTEA,
  "instructor_id" UUID NOT NULL,
  CONSTRAINT fk_course_instructor FOREIGN KEY("instructor_id") REFERENCES "InstructorProfile"("user_id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Module" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "course_id" UUID NOT NULL,
  "title" VARCHAR(128) NOT NULL,
  CONSTRAINT fk_module_course FOREIGN KEY("course_id") REFERENCES "Course"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "File" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "module_id" UUID NOT NULL,
  "title" VARCHAR(128) NOT NULL,
  "filename" VARCHAR NOT NULL,
  "file_type" VARCHAR NOT NULL,
  "file_size" INTEGER NOT NULL,
  "file_data" BYTEA NOT NULL,
  "transcription" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT fk_file_module FOREIGN KEY("module_id") REFERENCES "Module"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "FileChunk" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "content" TEXT NOT NULL,
  "embedding" vector(1536) NOT NULL,
  "file_id" UUID NOT NULL,
  "course_id" UUID NOT NULL,
  "chunk_index" INTEGER NOT NULL,
  CONSTRAINT fk_filechunk_file FOREIGN KEY("file_id") REFERENCES "File"("id") ON DELETE CASCADE,
  CONSTRAINT fk_filechunk_course FOREIGN KEY("course_id") REFERENCES "Course"("id") ON DELETE CASCADE,
  CONSTRAINT uq_filechunk_file_index UNIQUE("file_id", "chunk_index")
);

CREATE TABLE IF NOT EXISTS "AccessCode" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" VARCHAR(32) NOT NULL UNIQUE,
  "course_id" UUID NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT fk_accesscode_course FOREIGN KEY("course_id") REFERENCES "Course"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Enrollment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "course_id" UUID NOT NULL,
  "enrolled_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT fk_enroll_student FOREIGN KEY("user_id") REFERENCES "StudentProfile"("user_id") ON DELETE CASCADE,
  CONSTRAINT fk_enroll_course FOREIGN KEY("course_id") REFERENCES "Course"("id") ON DELETE CASCADE,
  CONSTRAINT uq_enrollment_student_course UNIQUE ("user_id", "course_id")
);

CREATE TABLE IF NOT EXISTS "PersonalizedFile" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "original_file_id" UUID,
  "content" JSONB   NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT fk_pfile_student FOREIGN KEY("user_id") REFERENCES "StudentProfile"("user_id") ON DELETE CASCADE,
  CONSTRAINT fk_pfile_original FOREIGN KEY("original_file_id") REFERENCES "File"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "Chat" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "file_id" UUID,
  "title" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT fk_chat_student FOREIGN KEY("user_id") REFERENCES "StudentProfile"("user_id") ON DELETE CASCADE,
  CONSTRAINT fk_chat_file FOREIGN KEY("file_id") REFERENCES "File"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "Message" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "chat_id" UUID NOT NULL,
  "role" VARCHAR NOT NULL,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT fk_message_chat FOREIGN KEY("chat_id") REFERENCES "Chat"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Report" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "course_id" UUID NOT NULL,
  "summary" JSONB NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT fk_report_course FOREIGN KEY("course_id") REFERENCES "Course"("id") ON DELETE CASCADE,
  CONSTRAINT uq_report_course UNIQUE("course_id")
);

CREATE TABLE IF NOT EXISTS "Market" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "snp500" NUMERIC NOT NULL,
  "date" DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS "News" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" VARCHAR(64) NOT NULL,
  "subject" VARCHAR(64) NOT NULL,
  "link" VARCHAR(120) NOT NULL
);

ALTER TABLE "Module" ADD COLUMN ordering integer NOT NULL DEFAULT 0;
ALTER TABLE "File" ADD COLUMN index_pkl bytea;
ALTER TABLE "File" ADD COLUMN index_faiss bytea;
ALTER TABLE "File" ADD COLUMN ordering integer NOT NULL DEFAULT 0;
ALTER TABLE "File" ADD COLUMN view_count_raw INTEGER NOT NULL DEFAULT 0,
ALTER TABLE "File" ADD COLUMN view_count_personalized INTEGER NOT NULL DEFAULT 0,
ALTER TABLE "File" ADD COLUMN chat_count INTEGER NOT NULL DEFAULT 0;