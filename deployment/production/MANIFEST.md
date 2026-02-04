# FlowStack Production Deployment Manifest

This document serves as the final technical blueprint for the FlowStack platform launch.

## 🔑 1. Security Keys (Generate these immediately)

Use the provided `scripts/generate-secrets.sh` to create these.
Use `scripts/setup-stripe-live.js` to automatically create products and prices in your Stripe account.

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | 64-character random string for SSO tokens. |
| `ENCRYPTION_MASTER_KEY` | 32-character string for OAuth token encryption. |
| `STRIPE_SECRET_KEY` | Live secret key from Stripe dashboard. |
| `STRIPE_WEBHOOK_SECRET` | Secret from Stripe webhook configuration. |
| `STRIPE_PRICE_STARTER` | Stripe Price ID for the Starter Plan (e.g., price_...). |
| `STRIPE_PRICE_PROFESSIONAL` | Stripe Price ID for the Professional Plan. |
| `STRIPE_PRICE_ENTERPRISE` | Stripe Price ID for the Enterprise Plan. |
| `GMAIL_CLIENT_SECRET` | Secret from Google Cloud Console. |
| `WHATSAPP_ACCESS_TOKEN` | System user token from Meta Developer portal. |

## 🗄️ 2. Database Provisioning (Supabase)

1. Create a new project in Supabase.
2. Open the **SQL Editor**.
3. Run the contents of `deployment/production/INIT_PRODUCTION_DB.sql`.
4. Copy the **Transaction** connection string for `DATABASE_URL`.

## 🚀 3. Service Deployment (Railway.app)

Create 4 Services from your GitHub repository:

| Service Name | Root Directory | Environment Group |
|--------------|----------------|-------------------|
| **core-api** | `products/core/apps/api` | `PLATFORM_SHARED` |
| **inbox-api** | `products/inboxpilot/apps/api` | `PLATFORM_SHARED` |
| **chat-api** | `products/chatflow/apps/api` | `PLATFORM_SHARED` |
| **calendar-api** | `products/calendarsync/apps/api` | `PLATFORM_SHARED` |

## 🌐 4. Frontend Deployment (Vercel)

Add 4 new projects in Vercel:

| Project Name | Root Directory | Production URL |
|--------------|----------------|----------------|
| **marketing-hub** | `(root)` | `flowstack.com` |
| **inbox-app** | `products/inboxpilot/apps/web` | `app.inboxpilot.com` |
| **chat-app** | `products/chatflow/apps/web` | `app.chatflow.com` |
| **calendar-app** | `products/calendarsync/apps/web` | `app.calendarsync.com` |

## ✅ 5. Final Launch Day Checklist

- [ ] **Google OAuth**: Add `https://inbox-api.yourdomain.com/api/v1/oauth/gmail/callback` to Authorized Redirect URIs.
- [ ] **Meta WhatsApp**: Set Webhook URL to `https://chat-api.yourdomain.com/api/v1/whatsapp/webhook`.
- [ ] **Stripe**: Configure platform-wide webhook to point to `https://core-api.yourdomain.com/api/v1/billing/webhook`.
- [ ] **CORS**: Ensure `CORS_ORIGIN` in Railway includes all 4 Vercel domains.
- [ ] **CI/CD**: Verify that the GitHub Action green-lights the final commit.
