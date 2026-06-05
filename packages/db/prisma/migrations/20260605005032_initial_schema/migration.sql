-- CreateEnum
CREATE TYPE "Role" AS ENUM ('student', 'teacher', 'institute_admin', 'platform_admin');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('hi', 'en');

-- CreateEnum
CREATE TYPE "ExamCategory" AS ENUM ('SSC_CGL', 'SSC_CHSL', 'SSC_MTS', 'SSC_GD', 'SSC_CPO', 'RAILWAY_NTPC', 'RAILWAY_GROUP_D', 'RAILWAY_ALP', 'RAILWAY_JE', 'UPSC_CSE', 'UPSC_CDS', 'UPSC_NDA', 'NEET_UG', 'NEET_PG', 'JEE_MAIN', 'JEE_ADVANCED', 'BOARDS_10TH', 'BOARDS_12TH');

-- CreateEnum
CREATE TYPE "DifficultyTag" AS ENUM ('easy', 'medium', 'hard');

-- CreateEnum
CREATE TYPE "MistakeType" AS ENUM ('concept', 'calc_slip', 'misread', 'time', 'guess');

-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('marketplace', 'institute', 'live', 'battle', 'baseline');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('in_progress', 'submitted', 'abandoned');

-- CreateEnum
CREATE TYPE "ConfidenceTag" AS ENUM ('sure', 'unsure', 'guess');

-- CreateEnum
CREATE TYPE "BattleStatus" AS ENUM ('waiting', 'active', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "TeacherStatus" AS ENUM ('pending', 'verified', 'suspended');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('pending', 'paid', 'refunded');

-- CreateEnum
CREATE TYPE "EarningsStatus" AS ENUM ('pending', 'paid');

-- CreateEnum
CREATE TYPE "InstituteType" AS ENUM ('coaching', 'school', 'college');

-- CreateEnum
CREATE TYPE "LiveTestStatus" AS ENUM ('scheduled', 'lobby_open', 'active', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "email" VARCHAR(255),
    "name" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'student',
    "language_pref" "Language" NOT NULL DEFAULT 'hi',
    "is_minor" BOOLEAN NOT NULL DEFAULT false,
    "dob" DATE,
    "consent_given" BOOLEAN NOT NULL DEFAULT false,
    "consent_at" TIMESTAMPTZ,
    "consent_guardian_id" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_requests" (
    "id" UUID NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "otp_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parental_consents" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "guardian_phone" VARCHAR(255) NOT NULL,
    "guardian_digi_locker_id" VARCHAR(255),
    "approved_at" TIMESTAMPTZ,
    "rejected_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parental_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "exam_category" "ExamCategory" NOT NULL,
    "exam_sub_type" VARCHAR(100),
    "target_year" INTEGER,
    "exam_date" DATE,
    "baseline_level" DECIMAL(5,2),
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "max_streak" INTEGER NOT NULL DEFAULT 0,
    "last_active_at" TIMESTAMPTZ,
    "institute_id" UUID,
    "is_minor_data" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "exam_category" "ExamCategory" NOT NULL,
    "subject" VARCHAR(100),
    "topic" VARCHAR(200),
    "sub_topic" VARCHAR(200),
    "language" "Language" NOT NULL DEFAULT 'hi',
    "question_text" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correct_option" VARCHAR(1) NOT NULL,
    "explanation" TEXT,
    "difficulty_tag" "DifficultyTag" NOT NULL,
    "irt_difficulty" DECIMAL(5,3),
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tests" (
    "id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "exam_category" "ExamCategory" NOT NULL,
    "created_by" UUID NOT NULL,
    "type" "TestType" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "duration_secs" INTEGER NOT NULL,
    "negative_marking" DECIMAL(4,3) NOT NULL DEFAULT 0,
    "total_marks" INTEGER NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "scheduled_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_questions" (
    "id" UUID NOT NULL,
    "test_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "order_index" INTEGER NOT NULL,
    "marks" DECIMAL(4,2) NOT NULL DEFAULT 1.0,

    CONSTRAINT "test_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_purchases" (
    "id" UUID NOT NULL,
    "test_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "amount_paid" DECIMAL(10,2) NOT NULL,
    "razorpay_order_id" VARCHAR(255),
    "razorpay_payment_id" VARCHAR(255),
    "status" "PurchaseStatus" NOT NULL DEFAULT 'pending',
    "purchased_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempts" (
    "id" UUID NOT NULL,
    "test_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ NOT NULL,
    "submitted_at" TIMESTAMPTZ,
    "score" DECIMAL(8,2),
    "total_marks" DECIMAL(8,2),
    "time_taken_secs" INTEGER,
    "status" "AttemptStatus" NOT NULL DEFAULT 'in_progress',
    "is_minor_data" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_answers" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "selected_option" VARCHAR(1),
    "is_correct" BOOLEAN,
    "time_spent_secs" INTEGER,
    "confidence_tag" "ConfidenceTag",
    "flagged" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "attempt_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mistake_classifications" (
    "id" UUID NOT NULL,
    "attempt_answer_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "mistake_type" "MistakeType" NOT NULL,
    "ai_confidence" DECIMAL(4,3),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mistake_classifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnosis_results" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "knowledge_rank" INTEGER,
    "strategy_rank" INTEGER,
    "overconfident_count" INTEGER NOT NULL DEFAULT 0,
    "underconfident_count" INTEGER NOT NULL DEFAULT 0,
    "top_mistake_type" "MistakeType",
    "aaj_ka_kaam" TEXT,
    "readiness_pct" DECIMAL(5,2),
    "is_minor_data" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnosis_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "galti_notebook_entries" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "attempt_answer_id" UUID NOT NULL,
    "mistake_type" "MistakeType" NOT NULL,
    "student_note" TEXT,
    "wrong_count" INTEGER NOT NULL DEFAULT 1,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "last_reviewed" TIMESTAMPTZ,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "galti_notebook_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "pan_number" VARCHAR(255),
    "pan_verified" BOOLEAN NOT NULL DEFAULT false,
    "digilocker_ref" VARCHAR(255),
    "exam_categories" "ExamCategory"[],
    "status" "TeacherStatus" NOT NULL DEFAULT 'pending',
    "verified_at" TIMESTAMPTZ,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_earnings" (
    "id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "test_purchase_id" UUID NOT NULL,
    "gross_amount" DECIMAL(10,2) NOT NULL,
    "platform_cut" DECIMAL(10,2) NOT NULL,
    "teacher_amount" DECIMAL(10,2) NOT NULL,
    "status" "EarningsStatus" NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMPTZ,

    CONSTRAINT "teacher_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institutes" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" "InstituteType" NOT NULL,
    "has_minor_students" BOOLEAN NOT NULL DEFAULT false,
    "dpa_signed" BOOLEAN NOT NULL DEFAULT false,
    "dpa_signed_at" TIMESTAMPTZ,
    "contact_user_id" UUID NOT NULL,
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "institutes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dpa_records" (
    "id" UUID NOT NULL,
    "institute_id" UUID NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "signed_at" TIMESTAMPTZ NOT NULL,
    "signed_by" VARCHAR(255) NOT NULL,
    "ip_address" VARCHAR(45) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dpa_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batches" (
    "id" UUID NOT NULL,
    "institute_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "exam_category" "ExamCategory" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_students" (
    "batch_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_students_pkey" PRIMARY KEY ("batch_id","student_id")
);

-- CreateTable
CREATE TABLE "batch_test_assignments" (
    "id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "test_id" UUID NOT NULL,
    "opens_at" TIMESTAMPTZ NOT NULL,
    "closes_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_test_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "battles" (
    "id" UUID NOT NULL,
    "player_1_id" UUID NOT NULL,
    "player_2_id" UUID,
    "test_id" UUID NOT NULL,
    "exam_category" "ExamCategory" NOT NULL,
    "status" "BattleStatus" NOT NULL DEFAULT 'waiting',
    "winner_id" UUID,
    "started_at" TIMESTAMPTZ,
    "ended_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "battles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "battle_answers" (
    "id" UUID NOT NULL,
    "battle_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "selected_option" VARCHAR(1),
    "is_correct" BOOLEAN,
    "time_spent_secs" INTEGER,

    CONSTRAINT "battle_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_tests" (
    "id" UUID NOT NULL,
    "test_id" UUID NOT NULL,
    "exam_category" "ExamCategory" NOT NULL,
    "scheduled_at" TIMESTAMPTZ NOT NULL,
    "status" "LiveTestStatus" NOT NULL DEFAULT 'scheduled',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_test_registrations" (
    "id" UUID NOT NULL,
    "live_test_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "registered_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_test_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_reports" (
    "id" UUID NOT NULL,
    "reported_by" UUID NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_role_is_active_idx" ON "users"("role", "is_active");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "otp_requests_phone_created_at_idx" ON "otp_requests"("phone", "created_at");

-- CreateIndex
CREATE INDEX "parental_consents_user_id_idx" ON "parental_consents"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_user_id_key" ON "student_profiles"("user_id");

-- CreateIndex
CREATE INDEX "student_profiles_exam_category_idx" ON "student_profiles"("exam_category");

-- CreateIndex
CREATE INDEX "student_profiles_institute_id_idx" ON "student_profiles"("institute_id");

-- CreateIndex
CREATE INDEX "student_profiles_last_active_at_idx" ON "student_profiles"("last_active_at");

-- CreateIndex
CREATE INDEX "questions_exam_category_difficulty_tag_subject_idx" ON "questions"("exam_category", "difficulty_tag", "subject");

-- CreateIndex
CREATE INDEX "questions_exam_category_irt_difficulty_idx" ON "questions"("exam_category", "irt_difficulty");

-- CreateIndex
CREATE INDEX "questions_created_by_idx" ON "questions"("created_by");

-- CreateIndex
CREATE INDEX "tests_exam_category_type_is_published_idx" ON "tests"("exam_category", "type", "is_published");

-- CreateIndex
CREATE INDEX "tests_created_by_idx" ON "tests"("created_by");

-- CreateIndex
CREATE INDEX "test_questions_test_id_idx" ON "test_questions"("test_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_questions_test_id_question_id_key" ON "test_questions"("test_id", "question_id");

-- CreateIndex
CREATE INDEX "test_purchases_student_id_idx" ON "test_purchases"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_purchases_test_id_student_id_key" ON "test_purchases"("test_id", "student_id");

-- CreateIndex
CREATE INDEX "attempts_student_id_status_idx" ON "attempts"("student_id", "status");

-- CreateIndex
CREATE INDEX "attempts_test_id_status_idx" ON "attempts"("test_id", "status");

-- CreateIndex
CREATE INDEX "attempt_answers_attempt_id_idx" ON "attempt_answers"("attempt_id");

-- CreateIndex
CREATE INDEX "attempt_answers_question_id_idx" ON "attempt_answers"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_answers_attempt_id_question_id_key" ON "attempt_answers"("attempt_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "mistake_classifications_attempt_answer_id_key" ON "mistake_classifications"("attempt_answer_id");

-- CreateIndex
CREATE INDEX "mistake_classifications_student_id_mistake_type_created_at_idx" ON "mistake_classifications"("student_id", "mistake_type", "created_at");

-- CreateIndex
CREATE INDEX "mistake_classifications_question_id_mistake_type_idx" ON "mistake_classifications"("question_id", "mistake_type");

-- CreateIndex
CREATE UNIQUE INDEX "diagnosis_results_attempt_id_key" ON "diagnosis_results"("attempt_id");

-- CreateIndex
CREATE INDEX "diagnosis_results_student_id_created_at_idx" ON "diagnosis_results"("student_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "galti_notebook_entries_attempt_answer_id_key" ON "galti_notebook_entries"("attempt_answer_id");

-- CreateIndex
CREATE INDEX "galti_notebook_entries_student_id_wrong_count_created_at_idx" ON "galti_notebook_entries"("student_id", "wrong_count", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_user_id_key" ON "teachers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_earnings_test_purchase_id_key" ON "teacher_earnings"("test_purchase_id");

-- CreateIndex
CREATE INDEX "teacher_earnings_teacher_id_status_idx" ON "teacher_earnings"("teacher_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "institutes_contact_user_id_key" ON "institutes"("contact_user_id");

-- CreateIndex
CREATE INDEX "dpa_records_institute_id_idx" ON "dpa_records"("institute_id");

-- CreateIndex
CREATE INDEX "batches_institute_id_idx" ON "batches"("institute_id");

-- CreateIndex
CREATE UNIQUE INDEX "batch_test_assignments_batch_id_test_id_key" ON "batch_test_assignments"("batch_id", "test_id");

-- CreateIndex
CREATE INDEX "battles_exam_category_status_created_at_idx" ON "battles"("exam_category", "status", "created_at");

-- CreateIndex
CREATE INDEX "battle_answers_battle_id_player_id_idx" ON "battle_answers"("battle_id", "player_id");

-- CreateIndex
CREATE UNIQUE INDEX "live_tests_test_id_key" ON "live_tests"("test_id");

-- CreateIndex
CREATE INDEX "live_tests_exam_category_scheduled_at_idx" ON "live_tests"("exam_category", "scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "live_test_registrations_live_test_id_student_id_key" ON "live_test_registrations"("live_test_id", "student_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "content_reports_status_created_at_idx" ON "content_reports"("status", "created_at");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parental_consents" ADD CONSTRAINT "parental_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_institute_id_fkey" FOREIGN KEY ("institute_id") REFERENCES "institutes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_purchases" ADD CONSTRAINT "test_purchases_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_purchases" ADD CONSTRAINT "test_purchases_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mistake_classifications" ADD CONSTRAINT "mistake_classifications_attempt_answer_id_fkey" FOREIGN KEY ("attempt_answer_id") REFERENCES "attempt_answers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mistake_classifications" ADD CONSTRAINT "mistake_classifications_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mistake_classifications" ADD CONSTRAINT "mistake_classifications_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosis_results" ADD CONSTRAINT "diagnosis_results_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosis_results" ADD CONSTRAINT "diagnosis_results_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "galti_notebook_entries" ADD CONSTRAINT "galti_notebook_entries_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "galti_notebook_entries" ADD CONSTRAINT "galti_notebook_entries_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "galti_notebook_entries" ADD CONSTRAINT "galti_notebook_entries_attempt_answer_id_fkey" FOREIGN KEY ("attempt_answer_id") REFERENCES "attempt_answers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_earnings" ADD CONSTRAINT "teacher_earnings_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_earnings" ADD CONSTRAINT "teacher_earnings_test_purchase_id_fkey" FOREIGN KEY ("test_purchase_id") REFERENCES "test_purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institutes" ADD CONSTRAINT "institutes_contact_user_id_fkey" FOREIGN KEY ("contact_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dpa_records" ADD CONSTRAINT "dpa_records_institute_id_fkey" FOREIGN KEY ("institute_id") REFERENCES "institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_institute_id_fkey" FOREIGN KEY ("institute_id") REFERENCES "institutes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_students" ADD CONSTRAINT "batch_students_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_students" ADD CONSTRAINT "batch_students_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_test_assignments" ADD CONSTRAINT "batch_test_assignments_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_test_assignments" ADD CONSTRAINT "batch_test_assignments_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battles" ADD CONSTRAINT "battles_player_1_id_fkey" FOREIGN KEY ("player_1_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battles" ADD CONSTRAINT "battles_player_2_id_fkey" FOREIGN KEY ("player_2_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battles" ADD CONSTRAINT "battles_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battles" ADD CONSTRAINT "battles_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle_answers" ADD CONSTRAINT "battle_answers_battle_id_fkey" FOREIGN KEY ("battle_id") REFERENCES "battles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_tests" ADD CONSTRAINT "live_tests_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_test_registrations" ADD CONSTRAINT "live_test_registrations_live_test_id_fkey" FOREIGN KEY ("live_test_id") REFERENCES "live_tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_test_registrations" ADD CONSTRAINT "live_test_registrations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
