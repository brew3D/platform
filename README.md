<div align="center">
  <h1>Simo Platform</h1>
  <p>Community platform with authentication, roles, posts, chat, docs, and admin tools.</p>
</div>

## Contents

- Quickstart
- Environment & Config
- Features
- Architecture
- Development & Scripts
- Ops: CI/CD, Staging, Monitoring
- Security & Compliance

## Quickstart

1) Install

```bash
npm ci
```

2) Configure environment

Copy `env.example.complete` to `.env.local` and fill required values:

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
DYNAMODB_TABLE_NAME=ruchi-ai-users
JWT_SECRET=... # openssl rand -base64 32

# SMTP for password reset emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@example.com

# Optional: Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
```

3) Run

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Features

- Authentication
  - Email/password with bcrypt + JWT
  - Password reset via SMTP + OTP expiry
  - 2FA (TOTP) setup/verify/disable; enforced at signin
  - Google OAuth via NextAuth with account linking
- Roles & Permissions
  - `admin`, `moderator`, `member`, `guest`
  - Role included in JWT, helpers for route protection
- Community & Content
  - Posts CRUD with comments, pin (mod/admin), report
  - Tags/categories view, pinned posts view
  - Pagination for posts list
- Knowledge Base
  - Docs/Tutorials CRUD API
- Notifications
  - In-app notifications storage (MVP)
- Admin
  - Admin dashboard with basic stats
- Developer & Ops
  - CI workflow (lint + build)
  - Staging env guidance

See progress dashboard at `/platform/features`.

## Architecture

- Next.js App Router
- APIs under `src/app/api/...`
- DynamoDB via AWS SDK v3 (DocClient)
- AuthContext on the client to manage tokens
- JWT for API auth; NextAuth for Google SSO

Tables (examples):
- `ruchi-ai-users` (users, roles, security)
- `ruchi-ai-community-posts` (posts, comments, tags, pin)
- `ruchi-ai-chats`, `ruchi-ai-messages` (chat)
- `ruchi-ai-tutorials` (docs)

## Development

Useful scripts:

```bash
npm run dev       # start next dev
npm run build     # build app
npm run start     # run production build
npm run lint      # run eslint
```

Related setup docs:
- `SETUP_AWS_ONLY.md` – DynamoDB auth setup
- `SETUP_AUTH_FIXED.md` – Dev mode and Google OAuth notes
- `DYNAMODB_SETUP.md` – schemas and permissions
- `CHAT_SYSTEM.md` – chat tables and endpoints

## Ops

### CI/CD
- GitHub Actions workflow: `.github/workflows/ci.yml`
- Runs on PRs and pushes to `main`: install, lint, build

### Staging
- Create `.env.staging` mirroring `.env.local`
- Configure staging deployment on your platform of choice

### Monitoring (optional)
- Sentry DSN env available in `env.example.complete`
- Enable and initialize client/server as needed

## Security & Compliance

- JWT signed with `JWT_SECRET`
- Role-based access in API routes
- 2FA (TOTP) support
- GDPR
  - Export: `GET /api/gdpr/export`
  - Delete: `POST /api/gdpr/delete`

## Roadmap

- Phase 2: search, events, gamification, webhooks, integrations
- Phase 3: AI moderation/summaries, multi-language, PWA, white-label, marketplace
