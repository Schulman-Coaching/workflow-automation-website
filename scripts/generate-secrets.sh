#!/bin/bash

# FlowStack Secret Generator
# Generates high-entropy security keys for production.

echo "🔒 Generating FlowStack Production Secrets..."

# Generate JWT Secret (64 chars)
JWT_SECRET=$(openssl rand -base64 48)
echo "JWT_SECRET=$JWT_SECRET"

# Generate Encryption Key (32 chars)
ENCRYPTION_KEY=$(openssl rand -hex 16)
echo "ENCRYPTION_MASTER_KEY=$ENCRYPTION_KEY"

# Generate WhatsApp Verify Token (16 chars)
WHATSAPP_TOKEN=$(openssl rand -hex 8)
echo "WHATSAPP_VERIFY_TOKEN=$WHATSAPP_TOKEN"

echo ""
echo "✅ Secrets generated successfully."
echo "⚠️  Copy these values into your Railway Environment Group immediately."
echo "⚠️  Do NOT commit these values to your repository."
