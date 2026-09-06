# ⚡ DealFlow360 — Next-Gen B2B Quotation-to-Cash & Sales Operations Platform

[![Frontend Deployed on Netlify](https://img.shields.io/badge/Frontend-Netlify%20Live-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://odoo-dealflow-360.netlify.app/)
[![Backend Deployed on Render](https://img.shields.io/badge/Backend-Render%20Live-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://odoo-dealflow360.onrender.com)
[![PostgreSQL](https://img.shields.io/badge/Database-Neon%20PostgreSQL-00E599?style=for-the-badge&logo=postgresql&logoColor=black)](https://neon.tech)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 18](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)

> **DealFlow360** is an enterprise-grade, self-governing B2B commercial operations platform. It unifies complex quotation drafting, algorithmic blended margin risk governance, dynamic multi-tier manager/finance approvals, zero-trust live customer negotiation, multi-hub inventory split routing, and hybrid billing (capital hardware + recurring cloud SLAs) into a single, cohesive workflow.

---

## 🌐 Live Deployments & Quick Links

| Resource | Live URL | Description |
| :--- | :--- | :--- |
| **Frontend Web App** | [https://odoo-dealflow-360.netlify.app/](https://odoo-dealflow-360.netlify.app/) | Complete Staff ERP + Customer Direct Portal |
| **Backend REST API** | [https://odoo-dealflow360.onrender.com](https://odoo-dealflow360.onrender.com) | Express 5 TypeScript API on Render |
| **Health Check Endpoint** | [https://odoo-dealflow360.onrender.com/api/health](https://odoo-dealflow360.onrender.com/health) | Uptime & Database Connectivity Monitor |

---

## 🔑 Demo Credentials

The database is pre-seeded with 8 internal enterprise staff personas and 20 corporate accounts across 4 tiers:

### 1. Internal ERP Staff Accounts (Access via `/login` or `/workspace`)
*All internal accounts share the default password:* `password123`

| Role | Name & Persona | Email | Access Scope |
| :--- | :--- | :--- | :--- |
| **System Admin** | System Admin | `admin@dealflow360.com` | Full Administrative & System Configuration Control |
| **Sales Manager** | Marcus Vance | `manager@dealflow360.com` | Commercial Governance, Level 1 Approvals, Pipeline |
| **Sales Rep** | Sarah Jenkins | `rep@dealflow360.com` | Quotation Builder, Storefront Deals, Customer Notes |
| **Finance Controller** | Fiona Sterling | `finance@dealflow360.com` | Level 2 High-Risk Approvals, Billing & Subscriptions |
| **Regional Manager** | Elena Vance | `manager2@dealflow360.com` | Multi-hub Operations & Regional Quota Analysis |
| **Lead Auditor** | Vikram Malhotra | `finance2@dealflow360.com` | Audit Ledgers, Invoicing & Proration Verification |

---

### 2. Customer Direct Portal Accounts (Access via `/portal/login`)
*All customer accounts share the default password:* `password123`

| Company | Tier | Contact Email | Direct Demo Token |
| :--- | :--- | :--- | :--- |
| **Acme Global Industries** | 🥇 Gold (15% base allowance) | `procurement@acme.com` | `acme_portal_demo_token_2026` |
| **Beta Technologies Corp** | 🥈 Silver (10% base allowance) | `buyer@betatech.io` | `beta_portal_demo_token_2026` |
| **Cyberdyne Systems India** | 💎 Platinum (20% base allowance) | `contact@cyberdyne.co.in` | `cyberdyne_portal_token_2026` |
| **Horizon Global Media** | 🥉 Bronze (5% base allowance) | `d.craig@horizonmedia.com` | `horizon_portal_token_2026` |

---

## 🏛️ System Architecture

DealFlow360 separates internal ERP operations from client-facing portals via an API Gateway with strict zero-trust boundary isolation.

```mermaid
flowchart TB
    subgraph Presentation ["Client Presentation Layer (React 18 + Vite + Tailwind)"]
        REP["Sales Workspace & Quoter"]
        MGR["Governance & Approval Radar"]
        OPS["Fulfillment & Logistics Split Matrix"]
        FIN["Billing, Invoicing & Subscriptions"]
        PORTAL["Customer Negotiation Portal (Zero-Trust Isolation)"]
    end

    subgraph Security ["Gateway & Security Layer"]
        ROUTER["Express 5 Router & Global Error Sanitizer"]
        JWT_AUTH["Internal Staff JWT & RBAC Middleware"]
        PORTAL_AUTH["Customer Token Verifier (SHA-256 Opaque Hash)"]
        RATE_LIMITER["Adaptive DDoS & Request Rate Limiter"]
    end

    subgraph CoreEngines ["Autonomous Business Logic Engines"]
        DISCOUNT_ENG["1. Discount Governance & Blended Risk Engine"]
        APPROVAL_ENG["2. Multi-Tier Dynamic Approval Router"]
        UPSELL_ENG["3. Co-Purchase Upsell & Affinity Matrix"]
        SPLIT_ENG["4. Multi-Warehouse Auto-Split Engine (Knapsack Heuristic)"]
        BILLING_ENG["5. Hybrid Billing Engine (Hardware + SaaS Recurring)"]
        RADAR_ENG["6. Sales Health & Anomaly Radar Scanner"]
    end

    subgraph Persistence ["Persistence & Cache Layer"]
        PRISMA["Prisma ORM 6.19"]
        POSTGRES[("Neon Cloud PostgreSQL (Connection Pooling)")]
        REDIS[("Redis Cache & BullMQ Event Queue")]
    end

    REP --> ROUTER
    MGR --> ROUTER
    OPS --> ROUTER
    FIN --> ROUTER
    PORTAL --> ROUTER

    ROUTER --> JWT_AUTH
    ROUTER --> PORTAL_AUTH
    ROUTER --> RATE_LIMITER

    JWT_AUTH --> DISCOUNT_ENG
    JWT_AUTH --> APPROVAL_ENG
    JWT_AUTH --> UPSELL_ENG
    JWT_AUTH --> SPLIT_ENG
    JWT_AUTH --> BILLING_ENG
    JWT_AUTH --> RADAR_ENG
    PORTAL_AUTH --> DISCOUNT_ENG

    DISCOUNT_ENG --> PRISMA
    APPROVAL_ENG --> PRISMA
    UPSELL_ENG --> PRISMA
    SPLIT_ENG --> PRISMA
    BILLING_ENG --> PRISMA
    RADAR_ENG --> PRISMA

    PRISMA --> POSTGRES
    ROUTER -. Caching & PubSub .-> REDIS
```

---

## 🗄️ Relational Entity-Relationship Diagram (ERD)

The data model enforces relational consistency between commercial negotiation, multi-hub inventory allocation, and financial reconciliation.

```mermaid
erDiagram
    CUSTOMER_TIER ||--o{ CUSTOMER : "classifies"
    CUSTOMER ||--o{ QUOTATION : "requests"
    CUSTOMER ||--o{ ORDER : "owns"
    CUSTOMER ||--o{ INVOICE : "billed"
    CUSTOMER ||--o{ SUBSCRIPTION : "subscribes"

    USER ||--o{ QUOTATION : "managed_by"
    USER ||--o{ APPROVAL : "audits"

    CATEGORY ||--o{ PRODUCT : "categorizes"
    PRODUCT ||--o{ PRODUCT_VARIANT : "variants"
    PRODUCT ||--o{ INVENTORY : "stocked_at"
    PRODUCT ||--o{ QUOTATION_ITEM : "line_item"
    PRODUCT ||--o{ ORDER_ITEM : "sold"

    WAREHOUSE ||--o{ INVENTORY : "stores"
    WAREHOUSE ||--o{ FULFILLMENT : "origin_hub"

    QUOTATION ||--o{ QUOTATION_ITEM : "includes"
    QUOTATION ||--o{ APPROVAL : "requires"
    QUOTATION ||--o{ NEGOTIATION_REQUEST : "negotiated"
    QUOTATION ||--o{ QUOTATION_COMMENT : "discussions"
    QUOTATION ||--o| ORDER : "converts_to"

    ORDER ||--o{ ORDER_ITEM : "contains"
    ORDER ||--o{ FULFILLMENT : "split_into"
    ORDER ||--o{ BACKORDER : "backorders"
    ORDER ||--o{ INVOICE : "invoiced_as"
    ORDER ||--o{ SUBSCRIPTION : "spawns"

    FULFILLMENT ||--o{ FULFILLMENT_ITEM : "manifests"
    INVOICE ||--o{ INVOICE_ITEM : "line_charges"
    INVOICE ||--o{ PAYMENT : "settled_by"
    SUBSCRIPTION ||--o{ BILLING_SCHEDULE : "recurs"

    CUSTOMER {
        uuid id PK
        string companyName
        string email UK
        string portalToken UK
        uuid customerTierId FK
    }

    QUOTATION {
        uuid id PK
        string quotationNumber UK
        decimal totalAmount
        decimal marginPercentage
        decimal riskScore
        int approvalLevel
        enum status
    }

    ORDER {
        uuid id PK
        string orderNumber UK
        decimal totalAmount
        enum status
    }

    FULFILLMENT {
        uuid id PK
        uuid orderId FK
        uuid warehouseId FK
        string shipmentNumber UK
        enum status
        decimal estimatedCost
    }

    INVOICE {
        uuid id PK
        string invoiceNumber UK
        decimal totalAmount
        decimal paidAmount
        enum invoiceType
        enum status
    }
```

---

## 🔄 End-to-End Deal Journey Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Rep as Sales Executive
    participant Quoter as Smart Quoter
    participant Gov as Risk & Governance Engine
    participant App as Approval Engine
    actor Client as Customer (Acme Global)
    participant Hub as Multi-Hub Split Engine
    participant Bill as Hybrid Billing Engine

    Rep->>Quoter: Draft quote: 100x Smart-UPS + 100mo Cloud SLA
    Rep->>Quoter: Apply 19% discount (exceeds Gold 15% allowance)
    Quoter->>Gov: Evaluate commercial margin & risk
    Gov-->>Quoter: Risk Score: 18.2 (Approval Level 1 Triggered)
    Rep->>App: Submit for Manager Approval
    App-->>Rep: Notification routed to Marcus Vance (Sales Manager)
    Note over App: Sales Manager approves with commercial justification
    App-->>Client: Quotation status updated to APPROVED

    Client->>Client: Open Customer Portal via secure token
    Client->>Client: Review line items (margins/costs stripped)
    Client->>Client: Click "Confirm & Place Order"
    Client->>Hub: Trigger multi-warehouse auto-split
    Hub->>Hub: Allocate Mumbai (200u), Bengaluru (200u), Delhi-NCR (200u)
    Hub-->>Client: 3 regional shipments reserved & tracked
    Hub->>Bill: Initiate dual milestone invoicing
    Bill-->>Client: Hardware Invoice (₹36,32,040) + Active Cloud SLA Subscription
```

---

## 🎯 The 6-Stage Commercial Deal Lifecycle

DealFlow360 enforces an end-to-end milestone stepper visualized dynamically across both the internal ERP and client portal:

```
[1. Quotation Drafted] ➜ [2. Margin & Governance] ➜ [3. Portal Negotiation] ➜ [4. Order & Invoiced] ➜ [5. Warehouse Allocation] ➜ [6. Dispatched & Delivered]
```

1. **Quotation Drafted**: Commercial lines assembled with live product images, SKU configurations, and volume discounts.
2. **Margin & Governance**: Live cost evaluation, blended margin risk score calculation, and tier policy enforcement.
3. **Portal Negotiation**: Real-time counter-offer exchange, itemized pricing adjustments, and discussion ledger.
4. **Order & Invoiced**: 1-click customer acceptance converting the quote to an immutable Sales Order with milestone billing.
5. **Warehouse Allocation**: Greedy Knapsack multi-hub routing checking stock across Mumbai, Bengaluru, and Delhi depots.
6. **Dispatched & Delivered**: Carrier waybill assignment, live route tracking, and proof-of-delivery reconciliation.

---

## 💡 Core Differentiators & Autonomous Engines

### 1. Blended Margin Risk & Governance Engine
Traditional ERPs enforce blunt single-item discount ceilings that sales reps easily bypass by spreading discounts across line items. DealFlow360 solves this with a **Blended Risk Formula**:

$$\text{Risk Score} = \sum_{i \in \text{Items}} \left( \frac{\text{Line Amount}_i}{\text{Total Amount}} \times \max(0, \text{Discount Given}_i - \text{Tier Ceiling}) \right) \times \text{Tier Risk Weight}$$

* **Level 0 (Risk < 10)**: Auto-approved immediately.
* **Level 1 (Risk 10 - 25)**: Requires Sales Manager approval (`SALES_MANAGER`).
* **Level 2 (Risk > 25)**: Dual sign-off required: Sales Manager + Finance Controller (`FINANCE`).

### 2. Multi-Warehouse Auto-Split & Routing Engine
Orders automatically decompose across regional logistics hubs (Mumbai Central, Bengaluru Regional, Delhi-NCR) based on available physical stock.
* **Greedy Knapsack Allocation**: Minimizes freight expenses by clustering orders into primary hubs.
* **FIFO Backorder Handling**: If aggregate inventory is depleted, excess units transition to an open backorder queue with automatic replenishment triggering.

### 3. Isolated Customer Direct Portal
* **Zero-Trust Token Architecture**: Operates on opaque 256-bit SHA-256 tokens completely decoupled from internal employee JWTs.
* **Data Masking**: Internal acquisition costs, raw margins, and internal risk scores are physically stripped at the database query level.
* **Real-Time Counter-Offers**: Customers can propose counter-discounts; if thresholds are exceeded, the deal automatically re-enters the manager approval chain without manual re-entry.

### 4. Hybrid Billing & Proration Engine
* **Unified Contract**: Manages both one-time capital hardware shipments and recurring cloud maintenance subscriptions on the same order.
* **Milestone Invoicing**: Generates distinct tax-compliant invoices, trackable payment receipts, and automated recurring billing schedules.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18, Vite 8, TypeScript 5 | Lightning-fast SPA with Hot Module Replacement |
| **Styling & Icons** | Vanilla CSS, Tailwind CSS tokens, Lucide React | Modern dark/light responsive interface |
| **State Management** | Redux Toolkit & Context API | Seamless global state & real-time sync |
| **Backend Runtime** | Node.js 20, Express 5 | High-throughput async REST API |
| **ORM & Database** | Prisma ORM 6.19, PostgreSQL (Neon Cloud) | Type-safe relational schema with connection pooling |
| **In-Memory Cache & Queue** | Redis, BullMQ | Fast query caching and background task scheduling |
| **Security** | JWT, bcrypt, Helmet, SHA-256, CORS | Enterprise role-based access control (RBAC) |
| **Hosting & CI/CD** | Netlify (Frontend) + Render (Backend) | Continuous automated deployment from GitHub |

---

## 📁 Repository Structure

```
odoo-dealflow360/
├── frontend/                     # React 18 + Vite SPA
│   ├── src/
│   │   ├── components/           # Reusable UI & Layout Components
│   │   │   ├── common/           # DealLifecycleStepper, Navbar, ErrorBoundaries
│   │   │   └── ui/               # Badges, Skeletons, Modals, Buttons
│   │   ├── pages/
│   │   │   ├── admin/            # Admin Settings, Users, Policies, System Health
│   │   │   ├── analytics/        # Sales Revenue & Governance Analytics
│   │   │   ├── approvals/        # Manager & Finance Multi-Tier Approval Radar
│   │   │   ├── billing/          # Invoices, Subscriptions & Credit Notes
│   │   │   ├── customers/        # Customer Directory & Tier Management
│   │   │   ├── fulfillment/      # Multi-Hub Dispatch & Backorder Routing
│   │   │   ├── intelligence/     # Deal Health Scanner & Anomaly Detector
│   │   │   ├── orders/           # Confirmed Sales Orders & Tracking
│   │   │   ├── portal/           # Customer Direct Portal (Storefront, Quotes, Orders)
│   │   │   └── quotations/       # Smart Quotation Builder & Pipeline
│   │   ├── services/             # Axios API Services (Auth, Portal, Quotation, etc.)
│   │   └── store/                # Redux Toolkit Slices
│   └── package.json
├── backend/                      # Express 5 TypeScript REST API
│   ├── prisma/
│   │   ├── schema/               # Modular Prisma Schema (auth, quotation, fulfillment, billing)
│   │   └── seed.ts               # Comprehensive Seed (~300+ entries)
│   ├── src/
│   │   ├── core/                 # Auth middleware, Redis client, Winston logger, DB config
│   │   ├── modules/              # Business Engines & REST Controllers
│   │   │   ├── approval/         # Dynamic Multi-Tier Approvals
│   │   │   ├── billing/          # Hybrid Invoicing & Subscriptions
│   │   │   ├── customer/         # Customers & Tier Management
│   │   │   ├── discount-engine/  # Blended Risk & Margin Calculations
│   │   │   ├── fulfillment/      # Knapsack Allocation & Logistics Routing
│   │   │   ├── intelligence/     # Deal Health & Anomaly Radar
│   │   │   ├── negotiation/      # Customer Portal & Counter-Offer Logic
│   │   │   └── quotations/       # Quotation CRUD, Line Items & Comments
│   │   ├── app.ts                # Express App Configuration & Route Mounting
│   │   └── index.ts              # Server Entry Point
│   └── package.json
├── docs/                         # Specifications & Design Roadmaps
└── README.md                     # Project Master Documentation
```

---

## 💻 Local Development Setup

### 1. Prerequisites
* **Node.js**: v20.x or higher
* **npm**: v10.x or higher
* **PostgreSQL**: Cloud Neon instance or local PostgreSQL

### 2. Clone & Setup Backend
```bash
git clone git@github.com:aditya3012singh/odoo-dealflow360.git
cd odoo-dealflow360/backend

# Install dependencies
npm install

# Configure environment variables in backend/.env
# DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
# JWT_ACCESS_SECRET="your_secret_key"
# PORT=5000

# Push Prisma Schema & Generate Client
npx prisma db push

# Seed database with demo data (300+ entries)
npm run prisma -- db seed

# Start development server
npm run dev
```
*Backend runs locally at: `http://localhost:5000`*

---

### 3. Setup Frontend
```bash
cd ../frontend

# Install dependencies
npm install

# Configure environment variables in frontend/.env
# VITE_API_URL=http://localhost:5000/api

# Start Vite development server
npm run dev
```
*Frontend runs locally at: `http://localhost:5173`*

---

## 🧪 Verification & Health Check

* **API Health Check**:
  ```bash
  curl https://odoo-dealflow360.onrender.com/health
  # Response: {"status":"UP","timestamp":"...","database":"CONNECTED"}
  ```
* **Production Build Test**:
  ```bash
  cd frontend && npm run build
  cd ../backend && npm run build
  ```

---

## 📄 License & Attribution

Developed for the **Odoo 2026 DealFlow360 Initiative**. Licensed under the [ISC License](LICENSE).
