# InboxPilot

## "Your AI Email Assistant"

An AI-powered email assistant SaaS for SMBs. Part of the FlowStack suite.

## Features

- **Smart Inbox Triage** - AI categorizes emails as urgent, action required, FYI, newsletter, or spam
- **AI Draft Assistant** - Generate professional email responses in seconds
- **Follow-Up Autopilot** - Never miss a follow-up with automated reminders
- **Unified Inbox** - Consolidate Gmail and Outlook accounts in one place

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | NestJS (Node.js/TypeScript) |
| Frontend | Next.js 14 (App Router) |
| Database | PostgreSQL + Prisma |
| Cache | Redis |
| AI | Ollama (self-hosted LLM) |
| Auth | JWT + OAuth 2.0 |

## Project Structure

```
inboxpilot/
├── apps/
│   ├── api/              # NestJS backend API
│   │   ├── src/
│   │   │   ├── auth/     # Authentication & JWT
│   │   │   ├── email/    # Email sync & OAuth
│   │   │   ├── ai/       # Ollama integration
│   │   │   └── ...
│   │   └── prisma/       # Database schema
│   └── web/              # Next.js frontend
│       └── src/
│           ├── app/      # App router pages
│           ├── lib/      # API client
│           └── store/    # Zustand state
├── packages/
│   └── shared/           # Shared types
└── infrastructure/       # Docker configs
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL 15+
- Redis 7+
- Ollama (for AI features)

### Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

3. **Configure your `.env` files** with:
   - Database URL
   - Redis URL
   - Gmail OAuth credentials (from Google Cloud Console)
   - JWT secret
   - Encryption key

4. **Set up the database:**
   ```bash
   pnpm db:push
   ```

5. **Start Ollama** (for AI features):
   ```bash
   ollama pull llama3.2:8b
   ollama serve
   ```

6. **Start development servers:**
   ```bash
   pnpm dev
   ```

   - API: http://localhost:3000
   - Web: http://localhost:3001

## Architecture Standards

InboxPilot follows strict architectural patterns to ensure scalability and security:

- **Identity Management**: Internal IDs are UUIDs. Provider IDs (Gmail/Outlook) are stored in separate fields with composite unique constraints on `(organizationId, emailAccountId, providerId)`.
- **Security**: 
  - JWT refresh token rotation with database-backed revocation.
  - Fail-fast configuration in production if security keys are missing.
  - Sensitive data (OAuth tokens) is encrypted at rest using AES-256-GCM.
- **Data Sync**: Prefers incremental synchronization using delta tokens stored in the `EmailAccount.syncState`.
- **Background Processing**: Heavy tasks (email sync, triage, follow-up checks) are offloaded to BullMQ workers.

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Create account
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user

### Email
- `GET /api/v1/oauth/gmail/connect` - Connect Gmail
- `GET /api/v1/email-accounts` - List connected accounts
- `POST /api/v1/email-accounts/:id/sync` - Sync emails
- `GET /api/v1/emails` - List emails
- `PATCH /api/v1/emails/:id` - Update email

### AI
- `POST /api/v1/ai/triage` - Triage emails
- `POST /api/v1/ai/draft` - Generate draft
- `POST /api/v1/ai/summarize` - Summarize email

## Target Market

Busy founders, sales leads, and ops managers drowning in email.

## Pricing

Premium tier: $29-49/user/month

## License

Proprietary - FlowStack
