---
name: Architecture Review
overview: Provide a thorough architecture-focused review of the repository, emphasizing system boundaries, data flow, security posture, and scaling risks across the marketing site and InboxPilot monorepo.
todos:
  - id: map-architecture
    content: Map components and boundaries from docs/entrypoints
    status: completed
  - id: review-backend
    content: Assess backend modules, data model, queues, integrations
    status: completed
  - id: cross-cutting
    content: Review auth/config/multitenancy/ops concerns
    status: completed
  - id: deliver-feedback
    content: Write structured architecture feedback report
    status: completed
isProject: false
---

# Architecture Review Plan

- Inventory and map the system boundaries and runtime components from docs and entrypoints, especially the marketing site and the InboxPilot monorepo: `[BRAINSTORM.md](BRAINSTORM.md)`, `[PRODUCTS-BRAINSTORM.md](PRODUCTS-BRAINSTORM.md)`, `[products/inboxpilot/README.md](products/inboxpilot/README.md)`, `[products/inboxpilot/apps/api/src/main.ts](products/inboxpilot/apps/api/src/main.ts)`, `[products/inboxpilot/apps/web/src/app/layout.tsx](products/inboxpilot/apps/web/src/app/layout.tsx)`.
- Analyze backend architecture layers (modules, data model, background processing, integrations) and identify structural risks or coupling: `[products/inboxpilot/apps/api/src/app.module.ts](products/inboxpilot/apps/api/src/app.module.ts)`, `[products/inboxpilot/apps/api/prisma/schema.prisma](products/inboxpilot/apps/api/prisma/schema.prisma)`, `[products/inboxpilot/apps/api/src/worker/worker.service.ts](products/inboxpilot/apps/api/src/worker/worker.service.ts)`, `[products/inboxpilot/apps/api/src/email/email.service.ts](products/inboxpilot/apps/api/src/email/email.service.ts)`, `[products/inboxpilot/apps/api/src/ai/ai.service.ts](products/inboxpilot/apps/api/src/ai/ai.service.ts)`.
- Review cross-cutting concerns (auth, secrets/config, multi-tenancy isolation, API client patterns, observability) to surface security and operational gaps: `[products/inboxpilot/apps/api/src/auth/auth.service.ts](products/inboxpilot/apps/api/src/auth/auth.service.ts)`, `[products/inboxpilot/apps/api/src/config/configuration.ts](products/inboxpilot/apps/api/src/config/configuration.ts)`, `[products/inboxpilot/apps/web/src/lib/api.ts](products/inboxpilot/apps/web/src/lib/api.ts)`, `[products/inboxpilot/apps/api/src/common/redis/redis.service.ts](products/inboxpilot/apps/api/src/common/redis/redis.service.ts)`.
- Deliver a structured architecture feedback report with prioritized findings, suggested remediations, and optional next steps for scaling and hardening.