# DealFlow360: One-Page Architecture Diagram & System Design

> **An Intelligent, Self-Governing Sales Operations Platform**  
> *End-to-End Quotation-to-Cash with Blended Risk Governance, Multi-Warehouse Split Routing, Hybrid Billing, and Live Customer Negotiation.*

---

## 1. High-Level System Architecture

```mermaid
flowchart TB
    subgraph ClientLayer ["Client Presentation Layer"]
        REP["Sales Workspace (React / Vite)"]
        MGR["Approval & Intelligence Hub"]
        OPS["Fulfillment & Billing Matrix"]
        PORTAL["Customer Negotiation Portal (Separate Opaque Token Auth)"]
    end

    subgraph APILayer ["API Gateway & Core Security Layer"]
        ROUTER["Express 5 REST API Gateway"]
        AUTH_JWT["Internal JWT & RBAC Middleware"]
        AUTH_PORTAL["Customer Portal Token Verifier (SHA-256 Hash)"]
        RATE_LIMIT["Adaptive Rate Limiter & Observability (Prometheus)"]
    end

    subgraph BusinessEngines ["Self-Governing Core Engines"]
        DISCOUNT_ENG["1. Discount Governance & Blended Risk Engine"]
        APPROVAL_ENG["2. Dynamic Multi-Tier Approval Chain Router"]
        UPSELL_ENG["3. Co-Purchase Upsell & Margin Intelligence"]
        SPLIT_ENG["4. Multi-Warehouse Auto-Split & Routing Engine"]
        BILLING_ENG["5. Hybrid Billing & Proration Engine"]
        INTELLIGENCE_ENG["6. Deal Health & Anomaly Detection Scanner"]
        EVENT_BUS["7. Dual-Mode Reactive Event Bus (Socket.IO + Redis)"]
    end

    subgraph DataStorage ["Persistence & Cache Layer"]
        PRISMA["Prisma 6 ORM"]
        POSTGRES[("PostgreSQL Database (Neon Cloud)")]
        REDIS[("Redis Cache & BullMQ Queue")]
    end

    REP --> ROUTER
    MGR --> ROUTER
    OPS --> ROUTER
    PORTAL --> ROUTER

    ROUTER --> AUTH_JWT
    ROUTER --> AUTH_PORTAL
    ROUTER --> RATE_LIMIT

    AUTH_JWT --> DISCOUNT_ENG
    AUTH_JWT --> APPROVAL_ENG
    AUTH_JWT --> UPSELL_ENG
    AUTH_JWT --> SPLIT_ENG
    AUTH_JWT --> BILLING_ENG
    AUTH_JWT --> INTELLIGENCE_ENG
    AUTH_PORTAL --> DISCOUNT_ENG

    DISCOUNT_ENG <--> EVENT_BUS
    APPROVAL_ENG <--> EVENT_BUS
    SPLIT_ENG <--> EVENT_BUS
    BILLING_ENG <--> EVENT_BUS
    INTELLIGENCE_ENG <--> EVENT_BUS

    DISCOUNT_ENG --> PRISMA
    APPROVAL_ENG --> PRISMA
    UPSELL_ENG --> PRISMA
    SPLIT_ENG --> PRISMA
    BILLING_ENG --> PRISMA
    INTELLIGENCE_ENG --> PRISMA

    PRISMA --> POSTGRES
    EVENT_BUS --> REDIS
```

---

## 2. Core Relational Data Model (ER Diagram)

The data model enforces relational consistency between commercial negotiation, inventory reality, and financial reconciliation on a unified contract.

```mermaid
erDiagram
    CUSTOMER_TIER ||--o{ CUSTOMER : "classifies"
    CUSTOMER ||--o{ QUOTATION : "requests"
    CUSTOMER ||--o{ ORDER : "owns"
    CUSTOMER ||--o{ INVOICE : "billed"
    CUSTOMER ||--o{ SUBSCRIPTION : "subscribes"

    USER ||--o{ QUOTATION : "rep_for"
    USER ||--o{ APPROVAL : "reviews"

    CATEGORY ||--o{ PRODUCT : "groups"
    PRODUCT ||--o{ PRODUCT_VARIANT : "has"
    PRODUCT ||--o{ INVENTORY : "stocked_at"
    PRODUCT ||--o{ QUOTATION_ITEM : "quoted"
    PRODUCT ||--o{ ORDER_ITEM : "sold"

    WAREHOUSE ||--o{ INVENTORY : "stores"
    WAREHOUSE ||--o{ FULFILLMENT : "ships_from"

    QUOTATION ||--o{ QUOTATION_ITEM : "contains"
    QUOTATION ||--o{ APPROVAL : "requires"
    QUOTATION ||--o{ NEGOTIATION_REQUEST : "negotiated_via"
    QUOTATION ||--o{ QUOTATION_COMMENT : "discussed_via"
    QUOTATION ||--o| ORDER : "converts_to"

    ORDER ||--o{ ORDER_ITEM : "comprises"
    ORDER ||--o{ FULFILLMENT : "split_into"
    ORDER ||--o{ BACKORDER : "queues"
    ORDER ||--o{ INVOICE : "invoiced_as"
    ORDER ||--o{ SUBSCRIPTION : "spawns"

    FULFILLMENT ||--o{ FULFILLMENT_ITEM : "packs"
    INVOICE ||--o{ INVOICE_ITEM : "bills"
    INVOICE ||--o{ PAYMENT : "collects"
    SUBSCRIPTION ||--o{ BILLING_SCHEDULE : "schedules"

    CUSTOMER {
        uuid id PK
        string companyName
        string email UK
        string portalToken UK
        boolean portalEnabled
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
        enum customerStatus
    }

    APPROVAL {
        uuid id PK
        uuid quotationId FK
        uuid reviewerId FK
        enum stepRole
        enum status
        string decisionReason
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
        string trackingNumber
        enum status
        decimal estimatedShippingCost
    }

    INVOICE {
        uuid id PK
        string invoiceNumber UK
        decimal totalAmount
        decimal paidAmount
        enum invoiceType
        enum paymentStatus
    }

    SUBSCRIPTION {
        uuid id PK
        uuid customerId FK
        uuid productId FK
        enum billingInterval
        datetime currentPeriodEnd
        enum status
    }
```

---

## 3. The 7 Major Business Engines & Communication Flow

```mermaid
sequenceDiagram
    autonumber
    actor Rep as Sales Rep
    participant QB as Quotation Builder
    participant Gov as Discount & Risk Engine
    participant App as Approval Engine
    participant Portal as Customer Portal
    participant Fulfill as Warehouse Split Engine
    participant Billing as Hybrid Billing Engine

    Rep->>QB: Add Hardware (₹1,50,000) + SaaS (₹15,000/mo)
    Rep->>Gov: Apply 22% Discount (exceeds Gold 15% ceiling)
    Gov-->>QB: Risk Score: 28.5 (Flagged Level 2: Sales Manager + Finance)
    Rep->>App: Submit for Approval
    App-->>Rep: Notification sent to Marcus (Manager) & Fiona (Finance)
    Note over App: Both Approvers grant clearance with audit note
    App-->>Portal: Quotation APPROVED & ready for client inspection

    actor Client as Customer (Acme Global)
    Client->>Portal: Login via Secure Portal Token
    Portal->>Client: View masked quotation (Margin & Cost hidden)
    Client->>Portal: Propose Counter-Offer: 24% discount + note
    Portal->>Gov: Re-evaluate commercial risk
    Gov->>App: Terms escalated (Auto re-enters approval chain)
    App-->>Portal: Revised terms accepted
    Client->>Portal: 1-Click "Confirm & Convert Order"

    Portal->>Fulfill: Initiate Split Routing
    Fulfill->>Fulfill: Check Main Warehouse (8 units) & East Depot (2 units)
    Fulfill-->>Rep: Auto-split: Ship 8 from Main, Ship 2 from East
    Fulfill->>Billing: Trigger Dual Invoicing
    Billing-->>Client: One-Time Hardware Invoice (₹11,70,000) + Monthly Schedule
```

---

## 4. Key Architectural Highlights

1. **Self-Governing Blended Risk Formulation**:
   $$\text{Risk Score} = \sum_{\text{lines}} \left( \frac{\text{Line Amount}}{\text{Total Amount}} \times \max(0, \text{Discount}_{\text{given}} - \text{Ceiling}_{\text{category}}) \right) \times \text{Tier Multiplier}$$
   Stops sales reps from distributing small margin erosions across multiple lines without detection.
2. **Zero-Trust Portal Isolation**:
   Customer Portal runs on opaque 256-bit SHA-256 tokens completely decoupled from internal employee JWTs. Sensitive internal costs, profit margins, and risk scores are physically omitted from portal API queries.
3. **Inventory-Aware Splitting**:
   Greedy Knapsack heuristic prioritizes primary warehouse fulfillment to minimize shipping parcels and costs, automatically generating FIFO backorder queues if aggregate inventory is insufficient.
4. **Hybrid Ledger Reconciliation**:
   Hardware capital expense and recurring software subscriptions live on the same deal, maintaining distinct revenue recognition schedules and proration ledgers.
