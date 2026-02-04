# FlowStack Cloud Deployment Guide

This document outlines the automated deployment strategy for FlowStack and how to scale it for future products.

## 🚀 The Automated Cloud Stack

We use a "Hybrid-Managed" approach for maximum speed and minimum maintenance:

1. **Backends (NestJS)**: [Railway.app](https://railway.app)
   - **Why**: Handles monorepos natively. Each `products/*/apps/api` folder is deployed as a standalone service.
   - **Automation**: Each product contains a `railway.json` which defines the build/start commands.

2. **Frontends (Next.js)**: [Vercel](https://vercel.com)
   - **Why**: Best-in-class performance for Next.js.
   - **Automation**: Vercel automatically detects the 4 Next.js apps in our monorepo.

3. **Database**: [Supabase](https://supabase.com) (Postgres)
   - **Why**: Managed, scalable, and includes free-tier tiers for new products.

## 🤖 Launching a New Product (The "Product #4" Checklist)

When you create a new product using the `flowstack-integrator` skill, follow these steps to automate its launch:

### 1. Provision Backend
- In Railway, create a new "Service".
- Point it to your GitHub repo.
- Set the **Root Directory** to `products/[new-product]/apps/api`.
- Railway will automatically detect the `railway.json` we scaffolded.

### 2. Provision Frontend
- In Vercel, "Add New Project".
- Set the **Root Directory** to `products/[new-product]/apps/web`.
- Vercel will handle the build and SSL.

### 3. Shared Environment Variables
Ensure the following are set in the platform's shared Environment Group:
- `JWT_SECRET`: Central platform secret.
- `CORE_API_URL`: `https://auth.yourdomain.com/api/v1`
- `DATABASE_URL`: Product-specific database string.
- `STRIPE_PRICE_STARTER`: price_...
- `STRIPE_PRICE_PROFESSIONAL`: price_...
- `STRIPE_PRICE_ENTERPRISE`: price_...

## 🛠️ Maintenance Automation
- **CI/CD**: The `.github/workflows/main.yml` automatically tests all 8 services on every push.
- **Bootstrapper**: Run `./scripts/bootstrap-deployment.sh` if you add a new product; it will automatically standardize the `package.json` and apply the cloud templates.
