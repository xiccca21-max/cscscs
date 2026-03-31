#!/bin/bash
set -e

echo "══════════════════════════════════════"
echo "  SKINSELL — Setup"
echo "══════════════════════════════════════"

# Check .env
if [ ! -f .env ]; then
  echo "ERROR: .env file not found."
  echo "Copy .env.example → .env and fill in your values first."
  exit 1
fi

# Install deps
echo ""
echo "→ Installing dependencies..."
npm install

# Generate Prisma Client
echo ""
echo "→ Generating Prisma Client..."
npx prisma generate

# Push schema to DB
echo ""
echo "→ Pushing schema to database..."
npx prisma db push

# Seed payment methods
echo ""
echo "→ Seeding payment methods..."
npx tsx prisma/seed-payments.ts

echo ""
echo "══════════════════════════════════════"
echo "  ✓ Setup complete!"
echo ""
echo "  Run:  npm run dev"
echo "  Open: http://localhost:3000"
echo "══════════════════════════════════════"
