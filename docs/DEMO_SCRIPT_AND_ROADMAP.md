# DealFlow360: 5-Minute Live Demo Script & Hackathon Roadmap

> **Target Audience:** Hackathon Judges, Technical Evaluators, and Product Leads  
> **Total Time:** 5 Minutes (0:00 - 5:00)  
> **Key Message:** DealFlow360 isn't just a static quoting tool—it is a self-governing sales operations engine that enforces pricing discipline, reacts to warehouse inventory reality, reconciles hybrid recurring billing, and empowers live portal customer negotiation.

---

## Part 1: Quick Reference Test Credentials

| Role | Username / Email | Password | Primary Mission |
| :--- | :--- | :--- | :--- |
| **Sales Rep** | `rep@dealflow360.com` | `password123` | Build quotes, apply discounts, review upsells |
| **Sales Manager** | `manager@dealflow360.com` | `password123` | Review Tier 1 discount approval requests |
| **Finance Controller** | `finance@dealflow360.com` | `password123` | Review Tier 2 high-risk approvals & credit notes |
| **Admin / Operations** | `admin@dealflow360.com` | `password123` | Multi-warehouse fulfillment split & catalog admin |
| **Customer (Portal)** | `procurement@acme.com` | *Token: `acme_portal_demo_token_2026`* | View quote, submit counter-offer, confirm order |

---

## Part 2: Timed 5-Minute Presentation Script

### Minute 0:00 – 0:45 | Introduction & The Problem
- **Spoken Cue:**
  > *"Most B2B sales tools are dumb forms: you build a quote, export a PDF, email it back and forth, and pray nobody gave away your margin. In the real world, quotes get stuck in approval purgatory, stock is split across multiple warehouses, and hardware is bundled with monthly SaaS. We built **DealFlow360**, a self-governing deal platform that solves this end-to-end."*
- **Visual Action:**
  - Start at `http://localhost:5173/workspace`. Show the **Deal Health & Anomaly Dashboard** with real-time alerts: Stalled deals, excessive discounts, and delivery slippage.

---

### Minute 0:45 – 1:45 | Flow 1: Quotation Building, Blended Risk & Upsell
- **Spoken Cue:**
  > *"Let's build a deal as Senior Rep Sarah Jenkins. Acme Global is a Gold tier client with a baseline 15% discount allowance. But notice our governance policies: Hardware allows 15%, but Services only allow 10% because of thin margins."*
- **Visual Action:**
  1. Open **Quotation Builder** (`/quotations/new` or select draft `Q-2026-0015`).
  2. Add **MacBook Pro M3 Max** (Hardware) and set a **12% discount** $\to$ *Indicator stays green*.
  3. Add **Enterprise Setup Service** and apply an **18% discount** (8% over ceiling).
  4. Point to the **Blended Risk Score** widget:
     > *"Watch how the system computes a blended risk score across the order. Even though the overall discount sounds reasonable, that one service line blew past its margin limit. The quote instantly locks and routes for dual-level approval: Sales Manager followed by Finance."*
  5. Point to the **Upsell & Cross-Sell Panel**:
     > *"Before submitting, our ML co-purchase engine suggests adding 3 Years Extended Care. Watch our profit margin recalculate in real-time when I click '+ Add to Quote'. Margin jumps by +4.2%!"*
  6. Click **"Submit for Approval"**.

---

### Minute 1:45 – 2:30 | Flow 2: Multi-Level Discount Governance & Audit Trail
- **Spoken Cue:**
  > *"Now let's switch to Sales Manager Marcus Vance and Finance Controller Fiona Sterling."*
- **Visual Action:**
  1. Navigate to **Approval Queue** (`/approvals`).
  2. Open the pending approval card for the quotation.
  3. Show the **Blended Risk Breakdown** and click **Approve** $\to$ provide compliance audit reason: `"Approved per strategic expansion agreement"`.
  4. Point out the audit trail: user stamp, timestamp, and immutable compliance log.
  5. The quotation is now marked **`APPROVED`** and ready for client review.

---

### Minute 2:30 – 3:30 | Flow 3: Live Customer Portal Negotiation (No Static PDFs!)
- **Spoken Cue:**
  > *"Instead of sending a static PDF attachment over email, our customer gets a secure, dedicated negotiation link. Notice: this is not just an internal screen with another label—it is a completely decoupled, zero-trust portal view."*
- **Visual Action:**
  1. Switch to the Customer Portal (`http://localhost:5173/portal/login`).
  2. Click **Acme Global** quick login $\to$ land on **Customer Portal Dashboard**.
  3. Point out: internal cost, profit margins, and risk scores are physically omitted for client confidentiality.
  4. Click on the quotation $\to$ open **Portal Quotation Detail**.
  5. Expand **"Propose Counter-Offer"**: Enter `20%` target discount with message: `"Can we get an additional volume discount for 20 units?"`.
  6. Click **"Submit Counter-Offer"** $\to$ explain:
     > *"If the customer asks for a discount that breaks policy, the engine catches it and automatically re-routes the quotation back to manager approval. Once approved, the customer clicks 'Confirm & Convert Order'."*
  7. Click **"Confirm & Place Order"** $\to$ *Order instantly converts!*

---

### Minute 3:30 – 4:30 | Flow 4: Multi-Warehouse Auto-Split & Hybrid Billing
- **Spoken Cue:**
  > *"Here is where real operations happen: warehouse reality and hybrid recurring billing."*
- **Visual Action:**
  1. Open the **Operations & Fulfillment Panel** (`/fulfillment`).
  2. Point to the **Order Routing & Split Engine**:
     > *"Acme ordered 10 units. Our Main Warehouse only has 8 units, while East Depot has the remaining 2. The system automatically computes an optimal split routing plan to minimize freight costs."*
  3. Click **"Commit Auto-Split"** $\to$ creates 2 separate shipments with dispatch tracking.
  4. Show the **Shipment Dispatch Hub**: enter tracking numbers, confirm delivery, or demonstrate backorder handling.
  5. Jump to **Billing & Subscriptions** (`/billing`):
     > *"Look at this order: the hardware MacBook is billed as a one-time invoice (₹11,70,000), while the Cloud Backup is scheduled as a monthly recurring subscription with automated proration and credit-note support!"*
  6. Click **"Record Payment"** on the invoice $\to$ invoice status flips to `PAID`.

---

### Minute 4:30 – 5:00 | Conclusion & Architecture Summary
- **Spoken Cue:**
  > *"In 5 minutes, we showed you a full B2B sales cycle that no traditional tool handles out-of-the-box: dynamic blended risk governance, AI upsell margin impact, live customer portal negotiation, multi-warehouse automated split fulfillment, and hybrid recurring billing. DealFlow360 turns messy sales chaos into a self-governing machine. Thank you!"*
- **Visual Action:**
  - Display the **One-Page Architecture Diagram** and open the floor for judges' Q&A.

---

## Part 3: The 8-Step Quick Test Flow Checklist

Judges or evaluators can run this exact sequence to verify all application logic:

- [x] **Step 1: Setup & Catalog** — Log in with `admin@dealflow360.com` (`password123`); verify Gold customer tier, Main/East warehouses, and subscription plans in Admin.
- [x] **Step 2: Excessive Discount** — Create a quote for Acme Global; add Hardware + Services with an 18% discount exceeding category limits.
- [x] **Step 3: Automatic Approval Routing** — Confirm quote automatically requires Sales Manager + Finance approval without manual rep request.
- [x] **Step 4: Live Upsell Margin Delta** — Accept the recommended co-purchase upsell; observe instant order total and gross margin recalculation.
- [x] **Step 5: Multi-Warehouse Split** — In Fulfillment, verify that the order splits across Main Warehouse (8 units) and East Depot (2 units).
- [x] **Step 6: Hybrid Billing Reconciliation** — In Billing, verify that one-time hardware and recurring SaaS lines generate separate ledger entries.
- [x] **Step 7: Customer Portal Negotiation** — Log into Portal as Acme Global; submit a counter-offer; confirm terms re-trigger governance.
- [x] **Step 8: Payment & Delivery** — Confirm order in portal, dispatch shipments with tracking numbers, and record invoice payment.

---

## Part 4: What We Would Build Next (Future Roadmap)

With additional engineering cycles, we would extend DealFlow360 in four high-impact areas:

### 1. AI Pricing Elasticity & Win-Probability Modeling
- Integrate an online machine-learning model trained on historical deal closures to calculate real-time **Win Probability vs. Discount Curves**.
- Recommend the optimal discount percentage that maximizes gross profit while keeping win probability above 80%.

### 2. Automated Carrier EDI / 3PL Webhooks (FedEx, BlueDart, Delhivery)
- Connect the Multi-Warehouse Fulfillment split directly to 3PL logistics APIs.
- Automatically generate shipping labels, manifest documents, and dispatch tracking webhooks without manual data entry.

### 3. Bi-Directional ERP Sync (SAP, NetSuite, Odoo)
- Implement bi-directional streaming connectors using Kafka or Debezium CDC (Change Data Capture) to synchronize confirmed sales orders directly into enterprise general ledgers and manufacturing inventory.

### 4. Smart Contract Escrow & Milestone Payments
- Allow enterprise buyers in the customer portal to fund project milestones via bank guarantee or escrow smart contracts, releasing payouts automatically upon verified warehouse delivery confirmation.
