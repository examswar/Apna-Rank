-- Performance indexes for Apna Rank at scale (10M+ users, 1-2M concurrent)
-- All indexes use IF NOT EXISTS for safe re-runs.
-- Partial indexes dramatically reduce index size and scan cost by
-- filtering out rows that are never queried together.

-- ── users ─────────────────────────────────────────────────────
-- Most queries filter is_active = true; index only those rows.
CREATE INDEX IF NOT EXISTS idx_users_active_role
  ON users (role, is_active)
  WHERE is_active = true;

-- ── questions ─────────────────────────────────────────────────
-- IRT-based question selection: only active questions with a calibrated difficulty.
-- Covers adaptive baseline, battle matchmaking, and exam-prep pools.
CREATE INDEX IF NOT EXISTS idx_questions_irt
  ON questions (exam_category, irt_difficulty)
  WHERE is_active = true AND irt_difficulty IS NOT NULL;

-- Manual difficulty selection before IRT is calibrated (new questions).
CREATE INDEX IF NOT EXISTS idx_questions_manual
  ON questions (exam_category, difficulty_tag, subject)
  WHERE is_active = true;

-- ── attempts ──────────────────────────────────────────────────
-- Dashboard, progress graph, leaderboard: almost always filter on submitted.
CREATE INDEX IF NOT EXISTS idx_attempts_student_submitted
  ON attempts (student_id, submitted_at DESC)
  WHERE status = 'submitted';

-- DPDP minor data firewall audit queries — keep separate from main index.
CREATE INDEX IF NOT EXISTS idx_attempts_minor
  ON attempts (student_id, submitted_at)
  WHERE is_minor_data = true;

-- ── attempt_answers ───────────────────────────────────────────
-- Mistake DNA aggregation and IRT recalibration both join on question_id + correctness.
CREATE INDEX IF NOT EXISTS idx_attempt_answers_question
  ON attempt_answers (question_id, is_correct)
  WHERE is_correct IS NOT NULL;

-- ── diagnosis_results ─────────────────────────────────────────
-- Public leaderboard / progress trend queries must exclude minor data.
CREATE INDEX IF NOT EXISTS idx_diagnosis_public
  ON diagnosis_results (student_id, created_at DESC)
  WHERE is_minor_data = false;

-- ── galti_notebook_entries ────────────────────────────────────
-- Notebook list sorted by most-repeated errors; skip resolved entries.
CREATE INDEX IF NOT EXISTS idx_notebook_unresolved
  ON galti_notebook_entries (student_id, wrong_count DESC, created_at DESC)
  WHERE is_resolved = false;

-- Recent unresolved entries for "aaj ka kaam" recommendation.
CREATE INDEX IF NOT EXISTS idx_notebook_recent
  ON galti_notebook_entries (student_id, created_at DESC)
  WHERE is_resolved = false;

-- ── teacher_earnings ──────────────────────────────────────────
-- Payout job scans pending earnings per teacher; most rows will be paid.
CREATE INDEX IF NOT EXISTS idx_earnings_pending
  ON teacher_earnings (teacher_id, status)
  WHERE status = 'pending';

-- ── battles ───────────────────────────────────────────────────
-- Matchmaking query: find WAITING battle with no opponent, same exam category.
-- This runs on EVERY challenge request — must be extremely fast.
CREATE INDEX IF NOT EXISTS idx_battles_matchmaking
  ON battles (exam_category, status, created_at)
  WHERE status = 'waiting' AND player_2_id IS NULL;

-- ── live_tests ────────────────────────────────────────────────
-- Upcoming live tests listing — only scheduled/lobby_open rows are shown.
CREATE INDEX IF NOT EXISTS idx_live_tests_upcoming
  ON live_tests (exam_category, scheduled_at)
  WHERE status IN ('scheduled', 'lobby_open');

-- ── notifications ─────────────────────────────────────────────
-- Unread count badge and notification list both filter is_read = false.
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications (user_id, created_at DESC)
  WHERE is_read = false;

-- ── Additional covering indexes for hot query paths ───────────

-- OTP rate limiting: check recent OTPs per phone in last 15 minutes.
-- Composite already defined in schema; adding DESC sort for recency.
CREATE INDEX IF NOT EXISTS idx_otp_phone_recent
  ON otp_requests (phone, created_at DESC);

-- Refresh token lookup by hash (login/refresh is a high-frequency path).
-- Schema has @@index([tokenHash]) but ensure it's non-revoked for fast lookup.
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active
  ON refresh_tokens (token_hash, expires_at)
  WHERE revoked_at IS NULL;

-- Battle answers aggregation per battle (compute result on completion).
CREATE INDEX IF NOT EXISTS idx_battle_answers_player
  ON battle_answers (battle_id, player_id);

-- Student profile lookup by institute (batch heatmap, dropout scan).
CREATE INDEX IF NOT EXISTS idx_student_profiles_institute
  ON student_profiles (institute_id, last_active_at DESC)
  WHERE institute_id IS NOT NULL;

-- Test purchase status for revenue reporting and payout calculation.
CREATE INDEX IF NOT EXISTS idx_test_purchases_paid
  ON test_purchases (purchased_at DESC)
  WHERE status = 'paid';
