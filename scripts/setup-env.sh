#!/bin/bash

# Generate environment file for Seneca
echo "Generating .env.local file..."

# Generate secrets
AUTH_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Create .env.local file
cat > .env.local << EOF
# Database (ローカル開発はDocker使用)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/seneca
TIMESCALE_URL=postgresql://postgres:postgres@localhost:5433/seneca_ts

# NextAuth v5 (JWT専用、DBセッション不要)
AUTH_SECRET=${AUTH_SECRET}
AUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true

# XRPL
XRPL_NETWORK=testnet
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Email (開発時は設定不要、本番で設定)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@seneca.com

# Exchange Rate APIs (USD基準)
COINGECKO_API_KEY=
EOF

echo "✅ .env.local file created successfully!"
echo "AUTH_SECRET: ${AUTH_SECRET}"
echo "ENCRYPTION_KEY: ${ENCRYPTION_KEY}"
