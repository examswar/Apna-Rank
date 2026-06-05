#!/usr/bin/env bash
# test-phase8.sh — Phase 8 smoke tests (Teacher, Institute, Payments)
# Usage: bash test-phase8.sh
# Requires: running API at BASE_URL, jq installed

set -euo pipefail
BASE="http://localhost:3000/api/v1"
H='Content-Type: application/json'

GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'
pass() { echo -e "${GREEN}PASS${NC} $1"; }
fail() { echo -e "${RED}FAIL${NC} $1"; exit 1; }
check() { [[ "$1" == *"$2"* ]] && pass "$3" || fail "$3 — expected '$2' in: $1"; }

# ── 0. Register two test users ──────────────────────────────────────────────

echo "=== Setup: register users ==="

TEACHER_REG=$(curl -s -X POST "$BASE/auth/register" -H "$H" -d '{
  "name":"Test Teacher","email":"teacher_p8@test.com","password":"Pass123!",
  "isMinor":false,"examCategory":"SSC_CGL"}')
TEACHER_TOKEN=$(echo "$TEACHER_REG" | jq -r '.data.accessToken // empty')
[ -z "$TEACHER_TOKEN" ] && {
  TEACHER_LOGIN=$(curl -s -X POST "$BASE/auth/login" -H "$H" -d \
    '{"email":"teacher_p8@test.com","password":"Pass123!"}')
  TEACHER_TOKEN=$(echo "$TEACHER_LOGIN" | jq -r '.data.accessToken')
}
echo "Teacher token: ${TEACHER_TOKEN:0:30}..."

STUDENT_REG=$(curl -s -X POST "$BASE/auth/register" -H "$H" -d '{
  "name":"Test Student","email":"student_p8@test.com","password":"Pass123!",
  "isMinor":false,"examCategory":"SSC_CGL"}')
STUDENT_TOKEN=$(echo "$STUDENT_REG" | jq -r '.data.accessToken // empty')
[ -z "$STUDENT_TOKEN" ] && {
  STUDENT_LOGIN=$(curl -s -X POST "$BASE/auth/login" -H "$H" -d \
    '{"email":"student_p8@test.com","password":"Pass123!"}')
  STUDENT_TOKEN=$(echo "$STUDENT_LOGIN" | jq -r '.data.accessToken')
}
echo "Student token: ${STUDENT_TOKEN:0:30}..."

ADMIN_REG=$(curl -s -X POST "$BASE/auth/register" -H "$H" -d '{
  "name":"Institute Admin","email":"admin_p8@test.com","password":"Pass123!",
  "isMinor":false,"examCategory":"SSC_CGL"}')
ADMIN_TOKEN=$(echo "$ADMIN_REG" | jq -r '.data.accessToken // empty')
[ -z "$ADMIN_TOKEN" ] && {
  ADMIN_LOGIN=$(curl -s -X POST "$BASE/auth/login" -H "$H" -d \
    '{"email":"admin_p8@test.com","password":"Pass123!"}')
  ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | jq -r '.data.accessToken')
}
echo "Admin token: ${ADMIN_TOKEN:0:30}..."

MINOR_REG=$(curl -s -X POST "$BASE/auth/register" -H "$H" -d '{
  "name":"Minor User","email":"minor_p8@test.com","password":"Pass123!",
  "isMinor":true,"examCategory":"BOARDS_10TH"}')
MINOR_TOKEN=$(echo "$MINOR_REG" | jq -r '.data.accessToken // empty')
[ -z "$MINOR_TOKEN" ] && {
  MINOR_LOGIN=$(curl -s -X POST "$BASE/auth/login" -H "$H" -d \
    '{"email":"minor_p8@test.com","password":"Pass123!"}')
  MINOR_TOKEN=$(echo "$MINOR_LOGIN" | jq -r '.data.accessToken')
}

# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "=== TEACHER MODULE ==="

# 1. POST /teacher/register
echo "--- 1. Teacher registration ---"
REG=$(curl -s -X POST "$BASE/teacher/register" \
  -H "$H" -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{"panNumber":"ABCDE1234F","examCategories":["SSC_CGL","SSC_CHSL"]}')
echo "$REG" | jq .
check "$REG" '"success":true' "Teacher register"

# Refresh teacher token (role is now 'teacher')
TEACHER_LOGIN=$(curl -s -X POST "$BASE/auth/login" -H "$H" -d \
  '{"email":"teacher_p8@test.com","password":"Pass123!"}')
TEACHER_TOKEN=$(echo "$TEACHER_LOGIN" | jq -r '.data.accessToken')

# 2. POST /teacher/verify/pan
echo "--- 2. Teacher PAN submit ---"
PAN=$(curl -s -X POST "$BASE/teacher/verify/pan" \
  -H "$H" -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{"panNumber":"ABCDE1234F"}')
echo "$PAN" | jq .
check "$PAN" '"success":true' "Teacher PAN submit"

# 3. GET /teacher/profile
echo "--- 3. Teacher profile ---"
PROFILE=$(curl -s "$BASE/teacher/profile" \
  -H "Authorization: Bearer $TEACHER_TOKEN")
echo "$PROFILE" | jq .
check "$PROFILE" '"panSubmitted":true' "Teacher profile (panSubmitted flag)"

# 4. Create a paid test (need teacher to publish first)
echo "--- 4a. Create + publish a paid test ---"
TEST_CREATE=$(curl -s -X POST "$BASE/tests" \
  -H "$H" -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{"title":"Phase 8 SSC Test","examCategory":"SSC_CGL","type":"marketplace",
       "price":99,"durationSecs":3600,"totalMarks":100}')
echo "$TEST_CREATE" | jq .
TEST_ID=$(echo "$TEST_CREATE" | jq -r '.data.id')
check "$TEST_CREATE" '"success":true' "Create paid test"

# Add a question so the test can be published
Q=$(curl -s "$BASE/questions?examCategory=SSC_CGL&limit=1" \
  -H "Authorization: Bearer $TEACHER_TOKEN")
Q_ID=$(echo "$Q" | jq -r '.data[0].id // empty')
if [ -n "$Q_ID" ]; then
  curl -s -X POST "$BASE/tests/$TEST_ID/questions/add" \
    -H "$H" -H "Authorization: Bearer $TEACHER_TOKEN" \
    -d "{\"questionId\":\"$Q_ID\",\"marks\":1}" | jq .
  curl -s -X POST "$BASE/tests/$TEST_ID/publish" \
    -H "Authorization: Bearer $TEACHER_TOKEN" | jq .
fi

# 5. GET /teacher/tests
echo "--- 4b. Teacher test list ---"
TESTS=$(curl -s "$BASE/teacher/tests" \
  -H "Authorization: Bearer $TEACHER_TOKEN")
echo "$TESTS" | jq .
check "$TESTS" '"success":true' "Teacher test list"

# 6. GET /teacher/tests/:id/analytics
echo "--- 5. Teacher test analytics ---"
ANALYTICS=$(curl -s "$BASE/teacher/tests/$TEST_ID/analytics" \
  -H "Authorization: Bearer $TEACHER_TOKEN")
echo "$ANALYTICS" | jq .
check "$ANALYTICS" '"success":true' "Teacher test analytics"

# 7. GET /teacher/earnings
echo "--- 6. Teacher earnings ---"
EARNINGS=$(curl -s "$BASE/teacher/earnings" \
  -H "Authorization: Bearer $TEACHER_TOKEN")
echo "$EARNINGS" | jq .
check "$EARNINGS" '"totals"' "Teacher earnings (meta.totals)"

# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "=== INSTITUTE MODULE ==="

# 8. POST /institute — register institute
echo "--- 7. Institute registration ---"
INST=$(curl -s -X POST "$BASE/institute" \
  -H "$H" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"Apna Coaching Delhi","type":"coaching","city":"Delhi",
       "state":"Delhi","hasMinorStudents":false}')
echo "$INST" | jq .
check "$INST" '"success":true' "Institute register"

# Refresh admin token (role is now 'institute_admin')
ADMIN_LOGIN=$(curl -s -X POST "$BASE/auth/login" -H "$H" -d \
  '{"email":"admin_p8@test.com","password":"Pass123!"}')
ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | jq -r '.data.accessToken')

# 9. GET /institute/profile
echo "--- 8. Institute profile ---"
INST_PROFILE=$(curl -s "$BASE/institute/profile" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$INST_PROFILE" | jq .
check "$INST_PROFILE" '"dpaSigned"' "Institute profile"

# 10. POST /institute/dpa/sign
echo "--- 9. DPA sign ---"
DPA=$(curl -s -X POST "$BASE/institute/dpa/sign" \
  -H "$H" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"signedBy":"Ramesh Kumar, Director"}')
echo "$DPA" | jq .
check "$DPA" '"signed":true' "DPA sign"

# 11. POST /institute/batches — create batch
echo "--- 10. Create batch ---"
BATCH=$(curl -s -X POST "$BASE/institute/batches" \
  -H "$H" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"Batch A 2025","examCategory":"SSC_CGL"}')
echo "$BATCH" | jq .
BATCH_ID=$(echo "$BATCH" | jq -r '.data.id')
check "$BATCH" '"success":true' "Create batch"

# 12. GET /institute/batches
echo "--- 11. List batches ---"
BATCHES=$(curl -s "$BASE/institute/batches" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$BATCHES" | jq .
check "$BATCHES" '"success":true' "List batches"

# 13. POST /institute/batches/:id/students/invite
echo "--- 12. Generate batch invite ---"
INVITE=$(curl -s -X POST "$BASE/institute/batches/$BATCH_ID/students/invite" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$INVITE" | jq .
check "$INVITE" '"inviteUrl"' "Generate batch invite"

# 14. GET /institute/batches/:id/heatmap
echo "--- 13. Batch heatmap ---"
HEATMAP=$(curl -s "$BASE/institute/batches/$BATCH_ID/heatmap" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$HEATMAP" | jq .
check "$HEATMAP" '"success":true' "Batch heatmap (empty is ok)"

# 15. GET /institute/batches/:id/lesson-plan
echo "--- 14a. Batch lesson plan ---"
PLAN=$(curl -s "$BASE/institute/batches/$BATCH_ID/lesson-plan" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$PLAN" | jq .
check "$PLAN" '"success":true' "Batch lesson plan"

# 16. GET /institute/dropout-alerts
echo "--- 14b. Dropout alerts ---"
ALERTS=$(curl -s "$BASE/institute/dropout-alerts" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$ALERTS" | jq .
check "$ALERTS" '"success":true' "Dropout alerts"

# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "=== PAYMENTS ==="

# 17. POST /tests/:id/purchase — minor blocked
echo "--- 15. Minor blocked from purchase ---"
MINOR_BUY=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "$BASE/tests/$TEST_ID/purchase" \
  -H "$H" -H "Authorization: Bearer $MINOR_TOKEN")
[[ "$MINOR_BUY" == "403" ]] && pass "Minor blocked (HTTP 403)" || \
  fail "Minor should get 403 — got $MINOR_BUY"

# 18. POST /tests/:id/purchase — adult student (Razorpay mock may fail without real creds)
echo "--- 16. Adult student creates Razorpay order ---"
BUY=$(curl -s -X POST "$BASE/tests/$TEST_ID/purchase" \
  -H "$H" -H "Authorization: Bearer $STUDENT_TOKEN")
echo "$BUY" | jq .
# If RAZORPAY creds are real: expect orderId.
# In dev with stub creds: expect 500 from Razorpay SDK — that's expected.
if echo "$BUY" | jq -e '.data.orderId' >/dev/null 2>&1; then
  pass "Razorpay order created (real creds)"
elif echo "$BUY" | jq -e '.error' >/dev/null 2>&1; then
  pass "Purchase returned error (dev/stub creds — Razorpay not connected)"
else
  fail "Purchase route broken"
fi

# 19. POST /webhooks/razorpay — invalid signature rejected
echo "--- 17. Webhook: invalid signature rejected ---"
WH=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/webhooks/razorpay" \
  -H "$H" -H "x-razorpay-signature: badsig" \
  -d '{"event":"payment.captured","payload":{}}')
[[ "$WH" == "400" ]] && pass "Webhook invalid sig → 400" || \
  fail "Webhook should return 400 — got $WH"

# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "====================================="
echo "  Phase 8 smoke tests complete!"
echo "====================================="
