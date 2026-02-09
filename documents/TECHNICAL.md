# Seneca - Technical Documentation

> A decentralized payroll management system powered by XRP Ledger, enabling seamless crypto salary payments with XRP and RLUSD.

## Overview

**Senecas a full-stack web application that revolutionizes payroll management by integrating cryptocurrency payments through the XRP Ledger. It provides a complete workflow from employee time tracking to crypto salary disbursement, supporting both XRP and RLUSD (Ripple USD stablecoin).

### Key Features

- **Simple Time Tracking**: Work/Rest/End button interface for intuitive clock-in/out
- **Flexible Application System**: Single, batch, or period-based payment applications
- **Approval Workflow**: Administrator review and approval process
- **Multi-Crypto Payments**: Support for both XRP and RLUSD
- **GemWallet Integration**: Secure browser-based wallet connection for manual signing
- **Dual Network Support**: Works on both Testnet and Mainnet

---

## Technology Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | Next.js 15 (App Router) | Full-stack web framework |
| **Frontend** | React 19, TailwindCSS 4 | UI components and styling |
| **Authentication** | NextAuth v5 (Auth.js) | JWT-based session management |
| **ORM** | Prisma | Database abstraction |
| **Main Database** | PostgreSQL (Supabase) | Users, organizations, settings |
| **Time-Series DB** | TimescaleDB | Timestamps, exchange rates, audit logs |
| **Blockchain** | xrpl.js v4.2.2 | XRP Ledger integration |
| **Wallet** | @gemwallet/api | Browser wallet connection |
| **Email** | Nodemailer | Notification emails |
| **Hosting** | Vercel | Deployment platform |

---

## System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        UI[React UI Components]
        GW[GemWallet Extension]
    end

    subgraph "Application Layer"
        SA[Server Actions]
        UC[Use Cases]
        GWY[Gateways]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL)]
        TS[(TimescaleDB)]
    end

    subgraph "External Services"
        XRPL[XRP Ledger]
        CG[CoinGecko API]
    end

    UI --> SA
    GW --> UI
    SA --> UC
    UC --> GWY
    GWY --> PG
    GWY --> TS
    GWY --> XRPL
    GWY --> CG
```

### Directory Structure

```
src/
  app/                    # Next.js App Router (thin layer)
  lib/
    client/
      features/           # Feature-based modules (Bulletproof React)
        auth/             # Authentication
        wallet/           # Wallet management
        payment-request/  # Payment requests
        ...
      hooks/              # Shared React hooks
      context/            # React Context providers
    server/
      use_case/           # Business logic (Clean Architecture)
      gateway/            # External service abstractions
      repository/         # Data access layer
      infra/              # Concrete implementations
      errors/             # Custom error classes
    shared/
      entity/             # Shared type definitions
```

---

## Architecture Deep Dive

Senecapts a hybrid architecture combining **Bulletproof React** on the client side with **Clean Architecture** on the server side, connected through Next.js Server Actions.

### Layered Architecture Overview

```mermaid
graph TB
    subgraph "Presentation Layer"
        direction LR
        Pages[Next.js Pages]
        Screens[Screen Components]
        Features[Feature Components]
    end

    subgraph "Application Layer"
        direction LR
        Actions[Server Actions]
        UseCases[Use Cases]
    end

    subgraph "Domain Layer"
        direction LR
        Entities[Entities]
        Errors[Domain Errors]
    end

    subgraph "Infrastructure Layer"
        direction LR
        Repos[Repositories]
        Gateways[Gateways]
        Infra[Infrastructure]
    end

    subgraph "External Systems"
        direction LR
        DB[(Databases)]
        XRPL[XRP Ledger]
        APIs[External APIs]
    end

    Pages --> Screens
    Screens --> Features
    Features --> Actions
    Actions --> UseCases
    UseCases --> Entities
    UseCases --> Repos
    UseCases --> Gateways
    Repos --> Infra
    Gateways --> Infra
    Infra --> DB
    Infra --> XRPL
    Infra --> APIs
```

### Client-Side Architecture (Bulletproof React)

The client follows a **feature-first** organization where each feature is a self-contained module.

```mermaid
graph TB
    subgraph "Feature Module Structure"
        direction TB
        Feature[feature/payment-request]

        subgraph "Components"
            UI1[PaymentForm.tsx]
            UI2[PaymentList.tsx]
            UI3[PaymentStatus.tsx]
        end

        subgraph "Hooks"
            H1[use-payment.ts]
            H2[use-payment-status.ts]
        end

        subgraph "Actions"
            A1[payment-actions.ts]
        end

        subgraph "Types"
            T1[index.ts]
        end

        Index[index.ts - Public API]
    end

    Feature --> Components
    Feature --> Hooks
    Feature --> Actions
    Feature --> Types
    Feature --> Index

    Hooks --> Actions
    Components --> Hooks
```

### Server-Side Architecture (Clean Architecture)

The server follows **Clean Architecture** principles with clear separation of concerns.

```mermaid
graph TB
    subgraph "Use Case Layer"
        UC[receivePayment.ts]
        UC2[approveApplication.ts]
        UC3[createTimeApplication.ts]
    end

    subgraph "Gateway Layer - Abstractions"
        G1[CryptoPaymentGateway]
        G2[TrustlineGateway]
        G3[ExchangeRateGateway]
    end

    subgraph "Repository Layer - Data Access"
        R1[PaymentRequestRepository]
        R2[ApplicationRepository]
        R3[WalletRepository]
    end

    subgraph "Infrastructure Layer - Implementations"
        I1[xrpl-payment-gateway.ts]
        I2[rlusd-payment-gateway.ts]
        I3[prisma-repositories.ts]
        I4[timescale-repositories.ts]
    end

    UC --> G1
    UC --> G2
    UC --> G3
    UC --> R1
    UC --> R2
    UC2 --> R2
    UC3 --> R2

    G1 -.->|implements| I1
    G1 -.->|implements| I2
    G2 -.->|implements| I1
    R1 -.->|implements| I3
    R2 -.->|implements| I4
```

### Dependency Flow

```mermaid
graph LR
    subgraph "Dependency Direction"
        UI[UI Components] --> SA[Server Actions]
        SA --> UC[Use Cases]
        UC --> GW[Gateways]
        UC --> RP[Repositories]
        GW --> IF[Infrastructure]
        RP --> IF
    end

    subgraph "Shared Layer"
        E[Entities/Types]
    end

    UI --> E
    SA --> E
    UC --> E
    GW --> E

    style E fill:#FFD700
```

### Request Flow Example: Payment Execution

```mermaid
sequenceDiagram
    participant UI as React Component
    participant Hook as usePayment Hook
    participant Action as Server Action
    participant UC as Use Case
    participant GW as Gateway
    participant XRPL as XRP Ledger

    UI->>Hook: handlePayment()
    Hook->>Action: createPaymentRequestAction(data)

    Note over Action: Validate input with Zod
    Action->>UC: receivePayment(input)

    Note over UC: Business Logic
    UC->>UC: Validate applications
    UC->>UC: Calculate amounts
    UC->>UC: Check balance

    UC->>GW: sendCryptoPayment(params)
    GW->>XRPL: submitAndWait(tx)
    XRPL-->>GW: TransactionResult
    GW-->>UC: PaymentResult

    UC->>UC: Update DB status
    UC-->>Action: PaymentResponse
    Action-->>Hook: ActionResult
    Hook-->>UI: Update State
```

### Database Architecture

```mermaid
graph TB
    subgraph "PostgreSQL - Supabase"
        direction TB
        PG[(PostgreSQL)]

        U[Users]
        O[Organizations]
        W[Wallets]
        C[CryptoSettings]
        A[Addresses]
    end

    subgraph "TimescaleDB - Time Series"
        direction TB
        TS[(TimescaleDB)]

        WT[work_timestamps]
        TA[time_applications]
        PT[payment_transactions]
        ER[exchange_rate_history]
        AL[audit_logs]
    end

    subgraph "Characteristics"
        PG -->|"ACID, Relations"| OLTP[Transactional Data]
        TS -->|"Time-partitioned, Fast Aggregation"| OLAP[Analytical Data]
    end
```

### Security Architecture

```mermaid
graph TB
    subgraph "Authentication Layer"
        Login[Login Request]
        Auth[NextAuth v5]
        JWT[JWT Token]
        Session[Session Cookie]
    end

    subgraph "Authorization Layer"
        MW[Middleware]
        RoleCheck[Role Verification]
        OrgCheck[Organization Check]
    end

    subgraph "Data Protection"
        Encrypt[AES-256 Encryption]
        Hash[bcrypt Hashing]
        Audit[Audit Logging]
    end

    subgraph "Wallet Security"
        GemWallet[GemWallet - Client Signing]
        HotWallet[Hot Wallet - Encrypted Seed]
    end

    Login --> Auth
    Auth --> JWT
    JWT --> Session

    Session --> MW
    MW --> RoleCheck
    RoleCheck --> OrgCheck

    HotWallet --> Encrypt
    Login --> Hash
    OrgCheck --> Audit

    style GemWallet fill:#90EE90
    style Encrypt fill:#FFD700
```

### Error Handling Strategy

```mermaid
graph TB
    subgraph "Error Types"
        VE[ValidationError - 400]
        AE[AuthenticationError - 401]
        AZE[AuthorizationError - 403]
        NE[NotFoundError - 404]
        CE[ConflictError - 409]
        PE[PaymentError - 502]
    end

    subgraph "XRPL Specific Errors"
        PE --> NoTL[NoTrustlineError]
        PE --> TLE[TrustlineLimitError]
        PE --> IBE[InsufficientBalanceError]
        PE --> IDE[InvalidDestinationError]
    end

    subgraph "Error Flow"
        UC[Use Case] -->|throws| Error[Domain Error]
        Error -->|caught by| Action[Server Action]
        Action -->|returns| Result[ActionResult]
        Result -->|handled by| UI[UI Component]
    end
```

### Scalability Considerations

```mermaid
graph LR
    subgraph "Horizontal Scaling"
        V1[Vercel Edge]
        V2[Vercel Edge]
        V3[Vercel Edge]
    end

    subgraph "Database Scaling"
        PG[PostgreSQL Primary]
        PGR[PostgreSQL Replica]
        TS[TimescaleDB Chunks]
    end

    subgraph "External Services"
        XRPL1[XRPL Node 1]
        XRPL2[XRPL Node 2]
    end

    V1 --> PG
    V2 --> PG
    V3 --> PGR

    V1 --> XRPL1
    V2 --> XRPL2
    V3 --> XRPL1
```

---

## User Roles & Workflows

### Participants

| Role | Description |
|------|-------------|
| **Admin** | Organization owner. Manages employees, approves applications, executes payments |
| **Worker** | Employee. Records work time, submits applications, receives crypto payments |

> **Note**: The same person can have both Admin and Worker accounts using the same email address.

---

## Core Workflow

```mermaid
sequenceDiagram
    participant W as Worker
    participant App as Seneca
    participant A as Admin
    participant XRPL as XRP Ledger

    Note over W,XRPL: 1. Time Tracking
    W->>App: Clock In (Work)
    W->>App: Take Break (Rest)
    W->>App: Clock Out (End)

    Note over W,XRPL: 2. Payment Application
    W->>App: Create Application
    App->>App: Calculate work hours & salary

    Note over W,XRPL: 3. Approval
    A->>App: Review Application
    A->>App: Approve/Reject

    Note over W,XRPL: 4. Payment
    W->>App: Request Payment (XRP/RLUSD)
    App->>XRPL: Execute Transaction
    XRPL-->>W: Receive Crypto
```

---

## XRP Ledger Integration

### Supported Networks

| Network | WebSocket Endpoint | Use Case |
|---------|-------------------|----------|
| **Testnet** | `wss://s.altnet.rippletest.net:51233` | Development & Testing |
| **Mainnet** | `wss://xrplcluster.com` | Production |

### Supported Currencies

#### XRP (Native Currency)
- Native asset on XRP Ledger
- Amount specified in **drops** (1 XRP = 1,000,000 drops)
- No trustline required

#### RLUSD (Ripple USD Stablecoin)
- Issued currency on XRP Ledger
- Amount specified in currency units (6 decimal precision)
- **Requires trustline** from recipient

```mermaid
graph LR
    subgraph "XRP Payment"
        A1[Sender Wallet] -->|XRP drops| B1[Recipient Wallet]
    end

    subgraph "RLUSD Payment"
        A2[Sender Wallet] -->|1. Check Trustline| TL[Trustline Validation]
        TL -->|2. RLUSD| B2[Recipient Wallet]
    end
```

### Payment Transaction Flow

```mermaid
flowchart TD
    Start([Payment Request]) --> ValidateApp[Validate Approved Applications]
    ValidateApp --> GetAddress[Get Worker's Crypto Address]
    GetAddress --> DetermineType{Currency Type?}

    DetermineType -->|XRP| CalcXRP[Calculate drops amount]
    DetermineType -->|RLUSD| CheckTL[Validate Trustline]
    CheckTL --> CalcRLUSD[Calculate token amount]

    CalcXRP --> GetWallet[Get Organization Wallet]
    CalcRLUSD --> GetWallet

    GetWallet --> CheckBalance[Check Balance]
    CheckBalance --> WalletType{Wallet Mode?}

    WalletType -->|Hot Wallet| AutoSign[Auto Sign & Submit]
    WalletType -->|GemWallet| ManualSign[Create Pending Request]

    AutoSign --> Submit[Submit to XRP Ledger]
    ManualSign --> AdminAction[Admin Signs with GemWallet]
    AdminAction --> Submit

    Submit --> TxResult{Transaction Result?}
    TxResult -->|tesSUCCESS| Complete([Payment Complete])
    TxResult -->|Error| Failed([Payment Failed])
```

### XRPL Code Examples

#### XRP Payment
```typescript
const payment: Payment = {
  TransactionType: 'Payment',
  Account: wallet.classicAddress,
  Destination: toAddress,
  Amount: amountDrops,  // e.g., "1000000" for 1 XRP
};

const result = await client.submitAndWait(payment, {
  autofill: true,
  wallet,
});
```

#### RLUSD Payment
```typescript
const rlusdAmount: IssuedCurrencyAmount = {
  currency: 'RLUSD',
  issuer: issuerAddress,
  value: '100.000000',  // 100 RLUSD
};

const payment: Payment = {
  TransactionType: 'Payment',
  Account: wallet.classicAddress,
  Destination: toAddress,
  Amount: rlusdAmount,
};
```

---

## GemWallet Integration

GemWallet provides a secure, non-custodial wallet solution where private keys never leave the user's browser.

### Connection Flow

```mermaid
sequenceDiagram
    participant User
    participant App as Seneca
    participant GW as GemWallet Extension

    User->>App: Click "Connect Wallet"
    App->>GW: isInstalled()
    GW-->>App: true

    App->>GW: getAddress()
    GW->>User: Show approval popup
    User->>GW: Approve
    GW-->>App: Wallet Address

    App->>GW: getNetwork()
    GW-->>App: "Mainnet" | "Testnet"

    App->>App: Store connection state
```

### Payment Signing Flow

```mermaid
sequenceDiagram
    participant Admin
    participant App as Seneca
    participant GW as GemWallet Extension
    participant XRPL as XRP Ledger

    Admin->>App: View Pending Payment
    App->>App: Verify wallet matches org wallet

    Admin->>App: Click "Execute Payment"
    App->>GW: sendPayment(params)
    GW->>Admin: Show transaction popup

    Admin->>GW: Approve & Sign
    GW->>XRPL: Submit Transaction
    XRPL-->>GW: Transaction Hash

    GW-->>App: Return hash
    App->>App: Update payment status
    App-->>Admin: Payment Complete
```

### Wallet Modes

| Mode | Description | Security |
|------|-------------|----------|
| **GemWallet (Manual)** | Admin signs each transaction via browser extension | High - Private key never stored on server |
| **Hot Wallet (Auto)** | Server stores encrypted seed for automatic signing | Medium - AES-256 encrypted storage |

---

## Data Model

```mermaid
erDiagram
    Organization ||--o{ AdminUser : has
    Organization ||--o{ WorkerUser : employs
    Organization ||--o{ OrganizationWallet : owns

    WorkerUser ||--o{ WorkTimestamp : records
    WorkerUser ||--o{ TimeApplication : submits
    WorkerUser ||--o{ CryptoAddress : has

    TimeApplication ||--o| PaymentRequest : generates

    OrganizationWallet {
        string id PK
        string walletAddress
        string walletSecretEnc "AES-256 encrypted (null for GemWallet)"
        boolean requiresManualSigning
        boolean isDefault
    }

    CryptoAddress {
        string id PK
        string address
        enum cryptoType "XRP | RLUSD"
        boolean hasTrustline
        boolean isDefault
    }

    PaymentRequest {
        string id PK
        decimal amountUsd
        enum cryptoType "XRP | RLUSD"
        decimal cryptoRate
        decimal cryptoAmount
        enum status "PENDING | PROCESSING | COMPLETED | FAILED"
        string transactionHash
        string dataHash "SHA256 for audit"
    }
```

---

## Security Features

### Authentication
- **JWT-based sessions** with 7-day expiration
- **bcrypt password hashing** with cost factor 12
- **Separate login flows** for Admin and Worker roles
- **Middleware protection** for role-based access control

### Wallet Security
- **GemWallet Mode**: Private keys never leave the browser
- **Hot Wallet Mode**: Seeds encrypted with AES-256
- **Balance verification** before each payment
- **Trustline validation** for RLUSD transactions

### Audit Trail
All critical operations are logged to TimescaleDB:
- Timestamp creation/modification
- Application submission/approval
- Payment execution with transaction hashes
- Data hashes for tamper detection

```mermaid
graph LR
    Action[User Action] --> Log[Audit Log]
    Log --> Hash[SHA256 Data Hash]
    Hash --> XRPL[Transaction Memo]
    XRPL --> Verify[On-chain Verification]
```

---

## API Integration

### Exchange Rates
- **CoinGecko API** for real-time XRP/USD rates
- **Fixed rate option** for RLUSD (configurable)
- **Rate history** stored in TimescaleDB

### XRPL Operations

| Operation | Method | Purpose |
|-----------|--------|---------|
| Connect | `Client.connect()` | Establish WebSocket connection |
| Balance | `account_info` | Get XRP balance |
| Trustlines | `account_lines` | Get token balances & trustlines |
| Payment | `submitAndWait()` | Execute and verify transaction |

---

## Environment Configuration

```env
# Database
DATABASE_URL=postgresql://...
TIMESCALE_URL=postgresql://...

# Authentication
AUTH_SECRET=<32-byte-base64>
AUTH_URL=https://your-domain.com

# XRPL Network
XRPL_NETWORK=testnet  # or mainnet

# RLUSD Configuration
RLUSD_ISSUER_ADDRESS=<issuer-address>
RLUSD_CURRENCY_CODE=RLUSD

# Security
ENCRYPTION_KEY=<32-byte-key>
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL & TimescaleDB
- GemWallet browser extension (for admin signing)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate deploy

# Start development server
npm run dev
```

### Testing on Testnet

1. Get testnet XRP from [XRPL Faucet](https://xrpl.org/xrp-testnet-faucet.html)
2. Configure GemWallet for Testnet
3. Set `XRPL_NETWORK=testnet` in environment

---

## Why XRP Ledger?

| Advantage | Benefit for Seneca
|-----------|------------------------|
| **Fast Settlement** | 3-5 second transaction finality |
| **Low Fees** | Minimal cost per payment (~$0.0002) |
| **Scalability** | 1,500+ TPS capacity |
| **RLUSD Support** | Stablecoin option for payroll |
| **Decentralized** | No single point of failure |
| **Eco-Friendly** | Carbon-neutral blockchain |

---

## Third-Party Libraries & Licenses

### Core Dependencies

| Library | Version | License | Purpose |
|---------|---------|---------|---------|
| `xrpl` | 4.2.2 | ISC | XRP Ledger SDK |
| `@gemwallet/api` | 3.8.0 | MIT | GemWallet integration |
| `next` | 15.1.3 | MIT | React framework |
| `next-auth` | 5.0.0-beta.25 | ISC | Authentication |
| `prisma` | 6.2.0 | Apache-2.0 | ORM |
| `react` | 19.0.0 | MIT | UI library |
| `tailwindcss` | 4.0.0 | MIT | Styling |
| `zod` | 3.24.1 | MIT | Validation |
| `pg` | 8.13.1 | MIT | PostgreSQL client |
| `bcryptjs` | 2.4.3 | MIT | Password hashing |
| `nodemailer` | 7.0.13 | MIT | Email sending |

### External Services

| Service | Purpose | License/Terms |
|---------|---------|---------------|
| CoinGecko API | Exchange rates | Free tier, commercial use allowed |
| Supabase | PostgreSQL hosting | Apache-2.0 |
| Vercel | Deployment | Commercial SaaS |
| XRPL Testnet/Mainnet | Blockchain network | Open network |

---

## Detailed Architecture Diagrams

### System Overview (Clean Architecture + Bulletproof React)

```mermaid
graph TB
    subgraph Client["🖥️ Client Layer"]
        WD[Worker Dashboard<br/>React 19]
        AD[Admin Dashboard<br/>React 19]
        GW[GemWallet<br/>Extension]
    end

    subgraph App["⚙️ Application Layer - Next.js 15"]
        SA[Server Actions]
        Auth[NextAuth v5<br/>JWT Session]
    end

    subgraph Domain["🏛️ Domain Layer"]
        subgraph UseCases["Use Cases"]
            UC1[receivePayment]
            UC2[approveApplication]
            UC3[createApplication]
        end
        subgraph Gateways["Gateways"]
            GW1[CryptoPayment]
            GW2[Trustline]
            GW3[ExchangeRate]
        end
        subgraph Repos["Repositories"]
            R1[PaymentRequest]
            R2[TimeApplication]
            R3[WorkTimestamp]
        end
    end

    subgraph Infra["🗄️ Infrastructure Layer"]
        PG[(PostgreSQL<br/>Supabase)]
        TS[(TimescaleDB)]
        XRPL[XRP Ledger<br/>Testnet/Mainnet]
        CG[CoinGecko API]
    end

    WD --> SA
    AD --> SA
    SA --> Auth
    SA --> UseCases

    UseCases --> Gateways
    UseCases --> Repos

    Gateways --> XRPL
    Gateways --> CG
    Repos --> PG
    Repos --> TS

    GW -.->|Manual Sign| XRPL

    style Client fill:#e1f5fe
    style App fill:#fff3e0
    style Domain fill:#f3e5f5
    style Infra fill:#e8f5e9
```

### Data Flow (End-to-End)

```mermaid
flowchart LR
    subgraph Step1["1️⃣ Clock In"]
        CI[Work / Rest / End]
        TS1[(TimescaleDB)]
    end

    subgraph Step2["2️⃣ Apply"]
        AP[Create Application]
        PG1[(PostgreSQL)]
    end

    subgraph Step3["3️⃣ Approve"]
        APR[Admin Review]
        PG2[(PostgreSQL)]
        TS2[(TimescaleDB<br/>Audit Log)]
    end

    subgraph Step4["4️⃣ Request Payment"]
        REQ[Payment Request]
        CG[CoinGecko<br/>Rate API]
    end

    subgraph Step5["5️⃣ Receive"]
        PAY[Execute Payment]
        XRPL[(XRP Ledger)]
    end

    CI --> TS1
    Step1 --> Step2
    AP --> PG1
    Step2 --> Step3
    APR --> PG2
    APR --> TS2
    Step3 --> Step4
    REQ --> CG
    Step4 --> Step5
    PAY --> XRPL

    style Step1 fill:#bbdefb
    style Step2 fill:#c8e6c9
    style Step3 fill:#fff9c4
    style Step4 fill:#ffccbc
    style Step5 fill:#d1c4e9
```

### Layered Architecture (Dependency Direction)

```mermaid
graph TB
    subgraph Presentation["Presentation Layer"]
        direction LR
        P1[Next.js Pages]
        P2[Screen Components]
        P3[Feature Components]
    end

    subgraph Application["Application Layer"]
        direction LR
        A1[Server Actions]
        A2[Use Cases]
    end

    subgraph DomainLayer["Domain Layer"]
        direction LR
        D1[Entities]
        D2[Domain Errors]
    end

    subgraph Infrastructure["Infrastructure Layer"]
        direction LR
        I1[Repositories]
        I2[Gateways]
        I3[Prisma / pg]
    end

    subgraph External["External Systems"]
        direction LR
        E1[(PostgreSQL)]
        E2[(TimescaleDB)]
        E3[XRP Ledger]
        E4[CoinGecko]
    end

    Presentation --> Application
    Application --> DomainLayer
    Application --> Infrastructure
    Infrastructure --> External

    style Presentation fill:#e3f2fd
    style Application fill:#fff8e1
    style DomainLayer fill:#fce4ec
    style Infrastructure fill:#e8f5e9
    style External fill:#f3e5f5
```

---

## Links

- [XRP Ledger Documentation](https://xrpl.org)
- [GemWallet](https://gemwallet.app)
- [RLUSD Information](https://ripple.com/solutions/stablecoin/)
