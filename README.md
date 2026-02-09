# Seneca - XRP Payroll Management System

Modern payroll management system powered by XRP Ledger. Track employee time, manage applications, and pay wages in cryptocurrency.

[![React](https://img.shields.io/badge/React-%2320232a.svg?logo=react&logoColor=%2361DAFB)](#) [![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js&logoColor=white)](#) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=flat-square&logo=tailwindcss) ![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql) ![TimescaleDB](https://img.shields.io/badge/TimescaleDB-2-0055CC?style=flat-square&logo=timescaledb) ![XRP](https://img.shields.io/badge/XRP-Ledger-00AAE4?style=flat-square&logo=xrp)


## 📚 Documentation

- [Project Overview](documents/PROJECT_OVERVIEW.md) - Project goals and features
- [Technical Documentation](documents/TECHNICAL.md) - Technical architecture and design

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd seneca
   npm install --legacy-peer-deps
   ```

2. **Start Docker services**
   ```bash
   docker-compose up -d
   ```

3. **Configure environment variables**

   Copy the example file and generate required secrets:
   ```bash
   cp .env.local.example .env.local
   ```

   Then edit `.env.local` and set the required values:
   ```bash
   # Generate AUTH_SECRET
   openssl rand -base64 32

   # Generate ENCRYPTION_KEY
   openssl rand -base64 32
   ```

   Alternatively, use the setup script:
   ```bash
   chmod +x scripts/setup-env.sh
   ./scripts/setup-env.sh
   ```

4. **Initialize databases**
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to PostgreSQL
   npm run db:push

   # Initialize TimescaleDB
   docker exec -i seneca-timescale psql -U postgres -d seneca_ts < scripts/init-timescale.sql

   # (Optional) Seed database with sample data
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📄 License

Private project - All rights reserved
