DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_kind') THEN
        CREATE TYPE document_kind AS ENUM ('text', 'code');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS "User" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "email" varchar(64) NOT NULL,
    "password" varchar(255),
    "firebase_uid" varchar(128)
);

CREATE TABLE IF NOT EXISTS "Chat" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "title" text NOT NULL,
    "userId" uuid NOT NULL,
    "visibility" varchar CHECK("visibility" IN ('public','private')) DEFAULT 'private' NOT NULL
);

CREATE TABLE IF NOT EXISTS "Document" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "title" text NOT NULL,
    "content" text,
    "kind" document_kind DEFAULT 'text' NOT NULL,
    "userId" uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS "Message" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "chatId" uuid NOT NULL,
    "role" varchar NOT NULL,
    "content" text NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Onboarding" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "userId" uuid NOT NULL,
    "name" text NOT NULL,
    "answers" jsonb NOT NULL,
    "quizzes" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Suggestion" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "documentId" uuid NOT NULL,
    "documentCreatedAt" timestamp NOT NULL,
    "originalText" text NOT NULL,
    "suggestedText" text NOT NULL,
    "description" text,
    "isResolved" boolean DEFAULT false NOT NULL,
    "userId" uuid NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Vote" (
    "chatId" uuid NOT NULL,
    "messageId" uuid NOT NULL,
    "isUpvoted" boolean NOT NULL,
    CONSTRAINT "Vote_chatId_messageId_pk" PRIMARY KEY("chatId", "messageId")
);

CREATE TABLE IF NOT EXISTS "Market" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "snp500" numeric NOT NULL,
    "date" date NOT NULL
);

CREATE TABLE IF NOT EXISTS "News" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "title" varchar(64) NOT NULL,
    "subject" varchar(64) NOT NULL,
    "link" varchar(120) NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "Chat" 
 ADD CONSTRAINT "Chat_userId_User_id_fk" 
 FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "Document" 
 ADD CONSTRAINT "Document_userId_User_id_fk" 
 FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "Message" 
 ADD CONSTRAINT "Message_chatId_Chat_id_fk" 
 FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "Onboarding" 
 ADD CONSTRAINT "Onboarding_userId_User_id_fk" 
 FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "Suggestion" 
 ADD CONSTRAINT "Suggestion_userId_User_id_fk" 
 FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "Suggestion" 
 ADD CONSTRAINT "Suggestion_documentId_documentCreatedAt_Document_id_createdAt_fk" 
 FOREIGN KEY ("documentId", "documentCreatedAt") REFERENCES "public"."Document"("id","createdAt") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "Vote" 
 ADD CONSTRAINT "Vote_chatId_Chat_id_fk" 
 FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "Vote" 
 ADD CONSTRAINT "Vote_messageId_Message_id_fk" 
 FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;