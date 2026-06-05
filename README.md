# Apna Rank — Backend API

Competitive exam preparation platform for Indian students (SSC, Railway, UPSC, NEET, JEE). Built as a pnpm monorepo with Fastify, Prisma, Socket.io, and BullMQ.

---

## Project Structure

```
apna-rank/
├── apps/
│   └── api/                        # Fastify REST + Socket.io server
│       └── src/
│           ├── index.ts            # Server entry point
│           ├── lib/                # config, errors, redis, response helpers
│           ├── middleware/         # authenticate, rbac, minor-guard
│           ├── jobs/               # BullMQ workers (diagnosis, battle, IRT, notifications)
│           └── modules/
│               ├── auth/           # OTP login, JWT, parental consent
│               ├── student/        # Profile, baseline, dashboard, Galti Notebook
│               ├── question/       # Question bank CRUD
│               ├── test/           # Test create/publish/purchase (Razorpay)
│               ├── attempt/        # Attempt submit + scoring
│               ├── diagnosis/      # AI diagnosis, Mistake DNA, Aaj Ka Kaam
│               ├── battle/         # 1v1 realtime battles (Socket.io + BullMQ timer)
│               ├── teacher/        # Teacher registration, PAN, analytics, earnings
│               ├── institute/      # Institute, batches, heatmap, lesson plan, dropout alerts
│               ├── notification/   # In-app notifications
│               └── webhooks/       # Razorpay webhook (HMAC-SHA256 verified)
├── packages/
│   └── db/                         # Prisma client + schema + migrations
│       ├── prisma/schema.prisma
│       └── src/index.ts            # Re-exports prisma client + encryptField/decryptField
├── docs/                           # PRD, TRD, schema docs, UI brief
├── .env.example                    # Template for all required env vars
├── pnpm-workspace.yaml
├── turbo.json
└── test-phase8.sh                  # Phase 8 curl smoke tests
```

---

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Fastify v5 |
| Language | TypeScript 5 |
| ORM | Prisma 6 |
| Database | Neon (Serverless Postgres) |
| Cache / Queue | Upstash Redis + BullMQ |
| Realtime | Socket.io v4 (`/battle` + `/live-test` namespaces) |
| Auth | RS256 JWT — 15 min access + 7 day httpOnly refresh cookie |
| Payments | Razorpay SDK v2 |
| Encryption | AES-256-GCM (PAN numbers, guardian phones) |
| Monorepo | Turborepo + pnpm workspaces |
| Testing | Vitest |

---

## Running Locally

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9 (`npm i -g pnpm`)
- A Neon Postgres project
- An Upstash Redis instance

### 1. Clone and install

```bash
git clone <repo-url>
cd apna-rank
pnpm install
```

### 2. Set up environment

```bash
cp .env.example .env
# Edit .env with your values (see Environment Variables below)
```

### 3. Generate RS256 keypair

```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
# Paste the contents into .env as single-line with \n separators
```

### 4. Generate field encryption key

```bash
openssl rand -hex 32
# Paste the 64-char hex into FIELD_ENCRYPTION_KEY in .env
```

### 5. Run database migrations

```bash
pnpm db:migrate
```

### 6. Start the API

```bash
pnpm dev
# API: http://localhost:8000
# Swagger docs: http://localhost:8000/docs
```

---

## Environment Variables

Copy `.env.example` to `.env` at the monorepo root and fill in every value.

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | No | `development` / `staging` / `production` (default: `development`) |
| `PORT` | No | HTTP port (default: `8000`) |
| `DATABASE_URL` | Yes | Neon pooled connection string (`?pgbouncer=true&connection_limit=1`) |
| `DIRECT_DATABASE_URL` | Yes | Neon direct connection string (used for migrations) |
| `JWT_PRIVATE_KEY` | Yes | RSA-2048 private key PEM — newlines as `\n` literals |
| `JWT_PUBLIC_KEY` | Yes | RSA-2048 public key PEM — newlines as `\n` literals |
| `REDIS_URL` | Yes | Upstash Redis connection URL (`rediss://default:...`) |
| `MSG91_AUTH_KEY` | Yes | MSG91 API key for OTP SMS delivery |
| `MSG91_TEMPLATE_ID` | Yes | MSG91 OTP message template ID |
| `ANTHROPIC_API_KEY` | Yes | Claude API key for AI diagnosis features |
| `RAZORPAY_KEY_ID` | Yes | Razorpay public key ID (safe to send to frontend) |
| `RAZORPAY_KEY_SECRET` | Yes | Razorpay secret key (server-side only, never exposed) |
| `RAZORPAY_WEBHOOK_SECRET` | Yes | Razorpay webhook signing secret for HMAC-SHA256 verification |
| `R2_ACCOUNT_ID` | Yes | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | Yes | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | Yes | Cloudflare R2 secret key |
| `R2_BUCKET_NAME` | Yes | R2 bucket name (e.g. `apna-rank-assets`) |
| `R2_PUBLIC_URL` | Yes | Public CDN base URL for R2 assets |
| `FIELD_ENCRYPTION_KEY` | Yes | 64-char hex string for AES-256-GCM PAN encryption (`openssl rand -hex 32`) |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins (default: `http://localhost:3000`) |
| `APP_BASE_URL` | No | Base URL for invite links (default: `http://localhost:3000`) |
| `SENTRY_DSN` | No | Sentry DSN for error tracking |

---

## API Endpoints

All routes are prefixed with `/api/v1`. Authenticated routes require `Authorization: Bearer <accessToken>`.

### Auth — `/api/v1/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/otp/send` | — | Send OTP to phone number |
| POST | `/otp/verify` | — | Verify OTP, issues access token + refresh cookie |
| POST | `/refresh` | cookie | Rotate refresh token, issues new access token |
| POST | `/logout` | Bearer | Revoke refresh token, clear cookie |
| GET | `/me` | Bearer | Get current user |
| POST | `/select-role` | Bearer | Set role (`student`/`teacher`/`institute_admin`) |
| POST | `/dob` | Bearer | Set date of birth (computes `isMinor` flag) |
| POST | `/consent` | — | Submit parental consent for a minor (DPDP Act) |

### Student — `/api/v1/student`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/onboarding/exam` | Bearer | Set exam category during onboarding |
| GET | `/profile` | Bearer | Get student profile |
| POST | `/profile` | Bearer | Update student profile |
| GET | `/baseline/start` | Bearer | Start baseline assessment |
| POST | `/baseline/answer` | Bearer | Submit a baseline answer |
| GET | `/dashboard` | Bearer | Student dashboard (streaks, recent attempts) |
| GET | `/galti-notebook` | Bearer | Paginated wrong-answer notebook |
| PATCH | `/galti-notebook/:id` | Bearer | Add note or mark entry resolved |
| GET | `/aaj-ka-kaam` | Bearer | Today's one priority task from latest diagnosis |
| GET | `/progress` | Bearer | Daily activity calendar |
| GET | `/readiness` | Bearer | Topic readiness percentage |

### Questions — `/api/v1`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/admin/questions` | Bearer (platform_admin) | Create a question |
| GET | `/questions` | Bearer | List questions (filterable by category, difficulty, topic) |
| GET | `/questions/:id` | Bearer | Get single question |
| PUT | `/questions/:id` | Bearer | Update question (creator or platform_admin) |

### Tests — `/api/v1/tests`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | Bearer (teacher/admin) | Create a new test |
| GET | `/` | Bearer | Browse published marketplace tests |
| GET | `/:id` | Bearer | Test detail + 2-question preview |
| PUT | `/:id` | Bearer | Update draft test |
| POST | `/:id/questions/add` | Bearer | Add question to draft test |
| POST | `/:id/publish` | Bearer | Publish test to marketplace |
| POST | `/:id/purchase` | Bearer (student, adult) | Create Razorpay order for paid test |
| POST | `/:id/attempt` | Bearer (student) | Start attempt on a test |
| PUT | `/attempts/:attemptId` | Bearer | Autosave in-progress attempt |
| POST | `/attempts/:attemptId/submit` | Bearer | Submit completed attempt |

### Attempts — `/api/v1/attempts`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Bearer | List student's past attempts (paginated) |
| GET | `/:id` | Bearer | Get single attempt detail |

### Diagnosis — `/api/v1/diagnosis`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/history` | Bearer | Paginated diagnosis history |
| GET | `/mistake-dna` | Bearer | 30-day aggregated weakness breakdown |
| GET | `/leaderboard` | Bearer (adult) | Percentile rank (minors blocked) |
| GET | `/:attemptId` | Bearer | Full diagnosis + Mistake DNA for one attempt |

### Battle — `/api/v1/battle` (adults only)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/challenge` | Bearer (adult) | Create WAITING battle, get shareable invite URL |
| POST | `/join/:inviteCode` | Bearer (adult) | Join a battle by invite code |
| POST | `/matchmake` | Bearer (adult) | Random matchmaking in same exam category |
| GET | `/history` | Bearer (adult) | Paginated battle history |
| GET | `/:battleId` | Bearer (adult) | Battle detail |
| POST | `/:battleId/forfeit` | Bearer (adult) | Forfeit an active battle |

#### Socket.io — `/battle` namespace

Connect at `ws://host/ws` with path `/ws`, namespace `/battle`.

| Event (client → server) | Description |
|---|---|
| `join_battle` | Join battle room. Payload: `{ battleId, token }` |
| `submit_answer` | Submit one answer. Payload: `{ battleId, questionId, selectedOption, timeSpentSecs }` |

| Event (server → client) | Description |
|---|---|
| `opponent_joined` | Emitted to player 1 when player 2 joins |
| `battle_result` | Emitted to both players with scores and winner when battle resolves |

### Teacher — `/api/v1/teacher`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | Bearer | Register as teacher (submits PAN, sets role) |
| POST | `/verify/pan` | Bearer (teacher) | Re-submit PAN for verification |
| GET | `/profile` | Bearer (teacher) | Teacher profile (`panSubmitted` boolean, never raw PAN) |
| GET | `/tests` | Bearer (teacher) | Paginated list of teacher's tests |
| GET | `/tests/:id/analytics` | Bearer (verified teacher) | Aggregate test analytics — no student PII |
| GET | `/earnings` | Bearer (verified teacher) | Paginated earnings with gross/net totals |

### Institute — `/api/v1/institute`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | Bearer | Register institute (role upgrades to `institute_admin`) |
| GET | `/profile` | Bearer (institute_admin) | Institute profile + batch count |
| POST | `/dpa/sign` | Bearer (institute_admin) | Sign Data Processing Agreement (immutable audit record) |
| GET | `/batches` | Bearer (institute_admin) | List all batches |
| POST | `/batches` | Bearer (institute_admin) | Create a new batch |
| POST | `/batches/:id/students/invite` | Bearer (institute_admin) | Generate 7-day batch invite link |
| GET | `/batches/:id/heatmap` | Bearer (institute_admin) | Topic-level error rate heatmap (no PII) |
| GET | `/batches/:id/lesson-plan` | Bearer (institute_admin) | Auto-generated Hindi 5-day lesson plan |
| GET | `/dropout-alerts` | Bearer (institute_admin) | Students inactive for 5+ days |

### Notifications — `/api/v1/notifications`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Bearer | Paginated notifications, unread first |
| GET | `/unread-count` | Bearer | Unread notification count (for badge) |
| PATCH | `/:id/read` | Bearer | Mark single notification read |
| POST | `/read-all` | Bearer | Mark all notifications read |

### Webhooks — `/api/v1/webhooks`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/razorpay` | HMAC-SHA256 | Payment captured → update TestPurchase, create TeacherEarning (60/40 split) |

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness check |
| GET | `/docs` | Swagger UI |

---

## DPDP Compliance (Minor Firewall)

Students under 18 (`isMinor: true`) are blocked at three layers:

1. **Route-level** — `blockMinors` middleware returns HTTP 403 on battle and purchase routes
2. **Data-level** — `isMinorData: false` filter on all analytics queries (heatmap, test analytics, dropout alerts)
3. **Database-level** — Postgres RLS policies (defined in Prisma schema)

---

## Payments Flow

1. Student calls `POST /tests/:id/purchase` → server fetches price from DB, creates Razorpay order, returns `{ orderId, amount, keyId }`
2. Frontend opens Razorpay checkout modal using `keyId` (public)
3. On payment success Razorpay calls `POST /api/v1/webhooks/razorpay`
4. Webhook verifies HMAC-SHA256 signature, marks `TestPurchase.status = 'paid'`, creates `TeacherEarning` (teacher: 60%, platform: 40%)

`RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are **never** sent to the client.

---

## Running Tests

```bash
pnpm test
# or for the API package only:
pnpm --filter @apna-rank/api test

# Phase 8 curl smoke tests (requires running API):
bash test-phase8.sh
```

---

## Database

Schema lives in `packages/db/prisma/schema.prisma`.

```bash
# Apply migrations (dev)
pnpm db:migrate

# Apply migrations (production)
pnpm db:migrate:deploy

# Push schema without migration (fast dev iteration)
pnpm db:push

# Open Prisma Studio
pnpm db:studio
```
