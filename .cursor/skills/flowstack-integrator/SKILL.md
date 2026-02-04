# FlowStack Product Integrator Skill

This skill guides agents in integrating new products into the FlowStack platform, ensuring architectural consistency across the monorepo.

## Context
FlowStack is a monorepo consisting of:
- Root Marketing Hub (Next.js 14)
- Product Suites (e.g., `products/inboxpilot`, `products/chatflow`, `products/calendarsync`)
- Each product suite contains `apps/api` (NestJS) and `apps/web` (Next.js).

## Instructions for Agents

### 1. Scaffold a New Product
When asked to create a new product:
- Create the directory structure: `products/[name]/apps/api/src` and `products/[name]/apps/web/src`.
- Mirror the NestJS architecture from `products/inboxpilot/apps/api`.
- Use Prisma for database management, following the `organizationId` multi-tenant pattern.
- Add the new product to the root `pnpm-workspace.yaml`.

### 2. Implement "User Voice" AI Training
Every FlowStack product must support AI personalization:
- Add `styleProfile` Json field to the `User` model in the product's `schema.prisma`.
- Implement an `AIService` that can:
    - Analyze historical data (emails, messages, or logs).
    - Extract linguistic style (greetings, tone, formality).
    - Inject this style into drafting/response prompts.
- Use the `WorkerModule` (BullMQ) for background analysis.

### 3. Unified Frontend Integration
- Link the product to the root Marketing Hub in `src/components/layout/Navigation.tsx`.
- Create a dedicated product landing page in `src/app/products/[name]/page.tsx`.
- Use the shared "Modern Enterprise" design system (Deep Purple `#4a1d96`, Accent Gold).

### 4. Third-Party API Pattern
- Define an interface for the provider (e.g., `WhatsAppProvider`, `CalendarProvider`).
- Implement OAuth 2.0 where possible, using the `EmailService` pattern from InboxPilot as a reference for secure token encryption and rotation.

## Verification Checklist
- [ ] No weak defaults in `configuration.ts`.
- [ ] `organizationId` isolation enforced in all Prisma queries.
- [ ] Lints passing in the product directory.
- [ ] Product added to root `pnpm-workspace.yaml`.
- [ ] Cursor rules copied/adapted to the product's `.cursor/rules` directory.

### 5. Deployment Automation
To ensure the product is cloud-ready:
- Ensure `apps/api/package.json` has a `start:prod` script: `"start:prod": "node dist/main"`.
- Ensure `apps/web/package.json` has a `start` script: `"start": "next start -p $PORT"`.
- Add the product to the platform's CI pipeline in `.github/workflows/main.yml`.
- (Optional) Provision a product-specific database using the platform's IaC templates.
