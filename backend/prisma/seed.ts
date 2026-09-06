import "dotenv/config";
import {
  PrismaClient,
  Role,
  RelationshipType,
  QuotationStatus,
  CustomerStatus,
  ApprovalStatus,
  ApprovalAction,
  OrderStatus,
  FulfillmentStatus,
  InvoiceType,
  InvoiceStatus,
  PaymentStatus,
  SubscriptionStatus,
  BillingScheduleStatus,
  AlertType,
  AlertSeverity,
  AlertStatus,
  BillingInterval,
} from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPortalToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function main() {
  console.log("🌱 Starting Comprehensive Seed for DealFlow360 (~300+ entries)...");

  // --- CLEANUP IN STRICT REVERSE FK ORDER ---
  console.log("🧹 Clearing old data...");
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.billingSchedule.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.fulfillmentItem.deleteMany();
  await prisma.fulfillment.deleteMany();
  await prisma.backorder.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.dealAlert.deleteMany();
  await prisma.upsellEvent.deleteMany();
  await prisma.changeRequest.deleteMany();
  await prisma.quotationComment.deleteMany();
  await prisma.negotiationRequest.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.quotationItem.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.productRelationship.deleteMany();
  await prisma.promotionProduct.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.priceListItem.deleteMany();
  await prisma.priceList.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.discountPolicy.deleteMany();
  await prisma.approvalRule.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.customerTier.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  const defaultPasswordHash = await bcrypt.hash("password123", 10);
  let totalSeeded = 0;

  // 1. SEED USERS (8 Users)
  console.log("👥 Seeding 8 Users...");
  const usersData = [
    { email: "admin@dealflow360.com", username: "System Admin", role: Role.ADMIN },
    { email: "manager@dealflow360.com", username: "Marcus Vance (Sales Manager)", role: Role.SALES_MANAGER },
    { email: "manager2@dealflow360.com", username: "Elena Vance (Regional Manager)", role: Role.SALES_MANAGER },
    { email: "rep@dealflow360.com", username: "Sarah Jenkins (Senior Rep)", role: Role.SALES_REP },
    { email: "rep2@dealflow360.com", username: "David Miller (Enterprise Rep)", role: Role.SALES_REP },
    { email: "rep3@dealflow360.com", username: "Priya Sharma (Cloud Specialist)", role: Role.SALES_REP },
    { email: "finance@dealflow360.com", username: "Fiona Sterling (Finance Controller)", role: Role.FINANCE },
    { email: "finance2@dealflow360.com", username: "Vikram Malhotra (Lead Auditor)", role: Role.FINANCE },
  ];

  const users: Record<string, any> = {};
  for (const u of usersData) {
    users[u.email] = await prisma.user.create({
      data: { email: u.email, username: u.username, password: defaultPasswordHash, role: u.role },
    });
    totalSeeded++;
  }

  // 2. SEED CUSTOMER TIERS (4 Tiers)
  console.log("🏅 Seeding 4 Customer Tiers...");
  const bronze = await prisma.customerTier.create({ data: { name: "Bronze", defaultDiscount: 5.0, description: "Baseline starter accounts (5% limit)." } });
  const silver = await prisma.customerTier.create({ data: { name: "Silver", defaultDiscount: 10.0, description: "Mid-market accounts (10% limit)." } });
  const gold = await prisma.customerTier.create({ data: { name: "Gold", defaultDiscount: 15.0, description: "Strategic enterprise accounts (15% limit)." } });
  const platinum = await prisma.customerTier.create({ data: { name: "Platinum", defaultDiscount: 20.0, description: "VIP Fortune 500 accounts (20% limit)." } });
  totalSeeded += 4;

  // 3. SEED CUSTOMERS (20 Customers)
  console.log("🏢 Seeding 20 Enterprise Customers...");
  const customerList = [
    { name: "Arthur Pendelton", email: "procurement@acme.com", companyName: "Acme Global Industries", tierId: gold.id, token: "acme_portal_demo_token_2026" },
    { name: "Elena Rostova", email: "buyer@betatech.io", companyName: "Beta Technologies Corp", tierId: silver.id, token: "beta_portal_demo_token_2026" },
    { name: "Vikram Singhania", email: "contact@cyberdyne.co.in", companyName: "Cyberdyne Systems India", tierId: platinum.id, token: "cyberdyne_portal_token_2026" },
    { name: "Samantha Reed", email: "procurement@apexlogistics.com", companyName: "Apex Logistics International", tierId: gold.id, token: "apex_portal_token_2026" },
    { name: "Carlos Mendez", email: "it@innovatehealth.org", companyName: "Innovate Health Solutions", tierId: silver.id, token: "innovate_portal_token_2026" },
    { name: "Rohan Kapoor", email: "rohan@nexuscloud.com", companyName: "Nexus Cloud Systems", tierId: platinum.id, token: "nexus_portal_token_2026" },
    { name: "Laura Vance", email: "lvance@quantumfintech.io", companyName: "Quantum Fintech Labs", tierId: gold.id, token: "quantum_portal_token_2026" },
    { name: "Daniel Craig", email: "d.craig@horizonmedia.com", companyName: "Horizon Global Media", tierId: bronze.id, token: "horizon_portal_token_2026" },
    { name: "Ananya Roy", email: "aroy@titanenergy.in", companyName: "Titan Renewable Energy", tierId: silver.id, token: "titan_portal_token_2026" },
    { name: "Michael Chang", email: "mchang@starlightaero.com", companyName: "Starlight Aerospace", tierId: platinum.id, token: "starlight_portal_token_2026" },
    { name: "Sophia Martinez", email: "smartinez@vanguardretail.com", companyName: "Vanguard Retail Group", tierId: bronze.id, token: "vanguard_portal_token_2026" },
    { name: "Amitabh Sen", email: "asen@zenithcorp.com", companyName: "Zenith Software Systems", tierId: gold.id, token: "zenith_portal_token_2026" },
    { name: "Claire Dupont", email: "cdupont@luminaai.io", companyName: "Lumina AI Research", tierId: silver.id, token: "lumina_portal_token_2026" },
    { name: "Rajesh Sharma", email: "rsharma@omniinfra.in", companyName: "Omni Infrastructure Ltd", tierId: gold.id, token: "omni_portal_token_2026" },
    { name: "Hannah Abbott", email: "habbott@biogenX.com", companyName: "BiogenX Pharmaceuticals", tierId: platinum.id, token: "biogenx_portal_token_2026" },
    { name: "Karan Patel", email: "karan@velocitymotors.in", companyName: "Velocity EV Tech", tierId: silver.id, token: "velocity_portal_token_2026" },
    { name: "Jessica Alba", email: "jalba@blueoceanventures.com", companyName: "Blue Ocean Capital", tierId: bronze.id, token: "blueocean_portal_token_2026" },
    { name: "Deepak Gupta", email: "dgupta@matrixnetworks.in", companyName: "Matrix Communications", tierId: gold.id, token: "matrix_portal_token_2026" },
    { name: "Olivia Wilde", email: "owilde@nextgensolutions.io", companyName: "NextGen Cloud Platforms", tierId: silver.id, token: "nextgen_portal_token_2026" },
    { name: "Tariq Mansoor", email: "tmansoor@crescentsteel.com", companyName: "Crescent Steel & Power", tierId: bronze.id, token: "crescent_portal_token_2026" },
  ];

  const customers: any[] = [];
  for (const c of customerList) {
    const cust = await prisma.customer.create({
      data: {
        name: c.name,
        email: c.email,
        phone: "+91 98765 " + Math.floor(10000 + Math.random() * 90000),
        companyName: c.companyName,
        customerTierId: c.tierId,
        portalEnabled: true,
        portalToken: hashPortalToken(c.token),
        password: defaultPasswordHash,
      },
    });
    customers.push(cust);
    totalSeeded++;
  }

  // 4. SEED PRODUCT CATEGORIES (6 Categories)
  console.log("📦 Seeding 6 Categories...");
  const catData = [
    { name: "Hardware", description: "Laptops, workstations, desktops, and computing devices." },
    { name: "Servers & Storage", description: "Enterprise rackmount servers, SAN/NAS, and storage arrays." },
    { name: "Networking & Security", description: "Switches, routers, firewalls, and SD-WAN appliances." },
    { name: "Peripherals & Docks", description: "Docks, 4K monitors, ergonomic mounts, and input gear." },
    { name: "Services", description: "Deployment, MDM setup, architecture advisory, and security audits." },
    { name: "Subscriptions", description: "Recurring SaaS licenses, 24/7 cloud SLA, and managed backup." },
  ];

  const categories: Record<string, any> = {};
  for (const cat of catData) {
    categories[cat.name] = await prisma.category.create({ data: cat });
    totalSeeded++;
  }

  // 5. SEED PRODUCTS (35 Products)
  console.log("💻 Seeding 35 Products across categories...");
  const productsData = [
    // Hardware
    { sku: "HW-MBP-16", name: "MacBook Pro M3 Max (36GB / 1TB)", cat: "Hardware", price: 150000, cost: 110000, rec: false, imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80" },
    { sku: "HW-THINK-X1", name: "Lenovo ThinkPad X1 Carbon Gen 11", cat: "Hardware", price: 140000, cost: 98000, rec: false, imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80" },
    { sku: "HW-DELL-XPS15", name: "Dell XPS 15 (i9 / 32GB / RTX 4060)", cat: "Hardware", price: 165000, cost: 120000, rec: false, imageUrl: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80" },
    { sku: "HW-HP-ZBOOK", name: "HP ZBook Studio G10 Workstation", cat: "Hardware", price: 180000, cost: 135000, rec: false, imageUrl: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80" },
    { sku: "HW-MAC-MINI", name: "Mac Studio M2 Ultra (64GB / 2TB)", cat: "Hardware", price: 210000, cost: 160000, rec: false, imageUrl: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=800&q=80" },
    { sku: "HW-DELL-OPTIPLEX", name: "Dell OptiPlex Small Form Factor Desktop", cat: "Hardware", price: 65000, cost: 45000, rec: false, imageUrl: "https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=800&q=80" },

    // Servers & Storage
    { sku: "SRV-DELL-R760", name: "Dell PowerEdge R760 Rack Server (2x Xeon, 128GB)", cat: "Servers & Storage", price: 450000, cost: 310000, rec: false, imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80" },
    { sku: "SRV-HPE-DL380", name: "HPE ProLiant DL380 Gen11 Server", cat: "Servers & Storage", price: 480000, cost: 330000, rec: false, imageUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80" },
    { sku: "SRV-CISCO-UCS", name: "Cisco UCS C220 M6 Rackmount Server", cat: "Servers & Storage", price: 520000, cost: 370000, rec: false, imageUrl: "https://images.unsplash.com/photo-1597852074816-d933c4d2b988?auto=format&fit=crop&w=800&q=80" },
    { sku: "STG-SYNOLOGY-NAS", name: "Synology RackStation RS3621xs+ 12-Bay NAS", cat: "Servers & Storage", price: 280000, cost: 195000, rec: false, imageUrl: "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=800&q=80" },
    { sku: "STG-SAN-FLASH", name: "Pure Storage FlashArray //X10 R3", cat: "Servers & Storage", price: 1200000, cost: 850000, rec: false, imageUrl: "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=800&q=80" },

    // Networking & Security
    { sku: "NET-CISCO-9300", name: "Cisco Catalyst 9300 48-Port PoE+ Switch", cat: "Networking & Security", price: 220000, cost: 150000, rec: false, imageUrl: "https://images.unsplash.com/photo-1551703599-6b3e8379aa8b?auto=format&fit=crop&w=800&q=80" },
    { sku: "NET-MERAKI-MX105", name: "Cisco Meraki MX105 Security Appliance", cat: "Networking & Security", price: 180000, cost: 125000, rec: false, imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80" },
    { sku: "NET-FORTI-100F", name: "Fortinet FortiGate 100F Next-Gen Firewall", cat: "Networking & Security", price: 240000, cost: 165000, rec: false, imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80" },
    { sku: "NET-UBI-UDMP", name: "Ubiquiti UniFi Dream Machine Special Edition", cat: "Networking & Security", price: 45000, cost: 30000, rec: false, imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80" },
    { sku: "NET-ARUBA-CX6300", name: "Aruba CX 6300M 24-Port Switch", cat: "Networking & Security", price: 195000, cost: 135000, rec: false, imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80" },

    // Peripherals & Docks
    { sku: "HW-DOCK-TB4", name: "Thunderbolt 4 Triple-Display Docking Station", cat: "Peripherals & Docks", price: 12000, cost: 7000, rec: false, imageUrl: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=800&q=80" },
    { sku: "HW-MON-DELL34", name: "Dell UltraSharp 34\" Curved USB-C Hub Monitor", cat: "Peripherals & Docks", price: 55000, cost: 38000, rec: false, imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80" },
    { sku: "HW-MON-LG27", name: "LG UltraFine 27\" 4K Color-Accurate Monitor", cat: "Peripherals & Docks", price: 42000, cost: 28000, rec: false, imageUrl: "https://images.unsplash.com/photo-1585792180666-f75c7c52b271?auto=format&fit=crop&w=800&q=80" },
    { sku: "HW-LOGI-MXMASTER", name: "Logitech MX Master 3S + MX Keys Combo", cat: "Peripherals & Docks", price: 18000, cost: 11000, rec: false, imageUrl: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80" },
    { sku: "HW-JABRA-EVOLVE2", name: "Jabra Evolve2 85 ANC Wireless Headset", cat: "Peripherals & Docks", price: 32000, cost: 20000, rec: false, imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80" },
    { sku: "HW-APC-UPS1500", name: "APC Smart-UPS 1500VA LCD 230V", cat: "Peripherals & Docks", price: 38000, cost: 25000, rec: false, imageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80" },

    // Professional Services
    { sku: "SRV-SETUP-ENT", name: "Enterprise Onboarding & Security Setup", cat: "Services", price: 30000, cost: 15000, rec: false, imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80" },
    { sku: "SRV-MDM-DEPLOY", name: "Automated Zero-Touch MDM Deployment", cat: "Services", price: 45000, cost: 20000, rec: false, imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80" },
    { sku: "SRV-SEC-AUDIT", name: "SOC 2 & ISO 27001 Security Penetration Audit", cat: "Services", price: 150000, cost: 65000, rec: false, imageUrl: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&w=800&q=80" },
    { sku: "SRV-CLOUD-MIGRATE", name: "Hybrid Cloud Infrastructure Migration Consulting", cat: "Services", price: 200000, cost: 90000, rec: false, imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80" },
    { sku: "SRV-TRAIN-STAFF", name: "On-Site Enterprise IT Staff Training", cat: "Services", price: 25000, cost: 10000, rec: false, imageUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80" },

    // Subscriptions
    { sku: "SUB-SLA-247", name: "24/7 Dedicated Cloud SLA & Maintenance", cat: "Subscriptions", price: 5000, cost: 1800, rec: true, imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80" },
    { sku: "SUB-SEC-SAAS", name: "Enterprise Endpoint Security SaaS (per user/mo)", cat: "Subscriptions", price: 1200, cost: 400, rec: true, imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80" },
    { sku: "SUB-BACKUP-CLOUD", name: "Managed Cloud Disaster Recovery & Backup (1TB)", cat: "Subscriptions", price: 3500, cost: 1100, rec: true, imageUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=800&q=80" },
    { sku: "SUB-AI-COPILOT", name: "DealFlow AI Intelligence Copilot Seat", cat: "Subscriptions", price: 2500, cost: 800, rec: true, imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80" },
    { sku: "SUB-VPN-SASE", name: "Global SASE Zero-Trust Network License", cat: "Subscriptions", price: 1800, cost: 600, rec: true, imageUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80" },
    { sku: "SUB-SIEM-LOGS", name: "Real-Time SIEM Threat Intelligence Feed", cat: "Subscriptions", price: 8500, cost: 3000, rec: true, imageUrl: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=800&q=80" },
    { sku: "SUB-MDM-LICENSE", name: "Mobile Device Management Cloud Portal License", cat: "Subscriptions", price: 800, cost: 250, rec: true, imageUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80" },
    { sku: "SUB-TELEMETRY-ADV", name: "Advanced System Telemetry & Alerting Suite", cat: "Subscriptions", price: 4200, cost: 1400, rec: true, imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80" },
  ];

  const products: Record<string, any> = {};
  for (const p of productsData) {
    products[p.sku] = await prisma.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        categoryId: categories[p.cat].id,
        description: `${p.name} - Enterprise commercial grade component.`,
        imageUrl: p.imageUrl,
        basePrice: p.price,
        costPrice: p.cost,
        unit: p.rec ? "month" : "unit",
        taxRate: 18.0,
        isRecurring: p.rec,
      },
    });
    totalSeeded++;
  }

  // 6. SEED UPSELL / CROSS-SELL RELATIONSHIPS (30 Relationships)
  console.log("🔗 Seeding 30 Upsell & Cross-Sell Rules...");
  const rels = [
    { p: "HW-MBP-16", r: "HW-DOCK-TB4", type: RelationshipType.CROSS_SELL, score: 0.95 },
    { p: "HW-MBP-16", r: "SUB-SLA-247", type: RelationshipType.UPSELL, score: 0.89 },
    { p: "HW-MBP-16", r: "HW-MON-DELL34", type: RelationshipType.CROSS_SELL, score: 0.91 },
    { p: "HW-THINK-X1", r: "HW-DOCK-TB4", type: RelationshipType.CROSS_SELL, score: 0.94 },
    { p: "HW-THINK-X1", r: "SRV-MDM-DEPLOY", type: RelationshipType.UPSELL, score: 0.86 },
    { p: "HW-DELL-XPS15", r: "HW-MON-LG27", type: RelationshipType.CROSS_SELL, score: 0.88 },
    { p: "SRV-DELL-R760", r: "SUB-BACKUP-CLOUD", type: RelationshipType.UPSELL, score: 0.97 },
    { p: "SRV-DELL-R760", r: "SRV-SETUP-ENT", type: RelationshipType.CROSS_SELL, score: 0.92 },
    { p: "SRV-HPE-DL380", r: "STG-SYNOLOGY-NAS", type: RelationshipType.CROSS_SELL, score: 0.85 },
    { p: "SRV-HPE-DL380", r: "SUB-SIEM-LOGS", type: RelationshipType.UPSELL, score: 0.90 },
    { p: "NET-CISCO-9300", r: "NET-MERAKI-MX105", type: RelationshipType.CROSS_SELL, score: 0.93 },
    { p: "NET-CISCO-9300", r: "SRV-CLOUD-MIGRATE", type: RelationshipType.UPSELL, score: 0.87 },
    { p: "NET-FORTI-100F", r: "SUB-VPN-SASE", type: RelationshipType.UPSELL, score: 0.96 },
    { p: "HW-MON-DELL34", r: "HW-LOGI-MXMASTER", type: RelationshipType.CROSS_SELL, score: 0.89 },
    { p: "HW-MON-LG27", r: "HW-JABRA-EVOLVE2", type: RelationshipType.CROSS_SELL, score: 0.82 },
    { p: "SRV-SETUP-ENT", r: "SUB-SLA-247", type: RelationshipType.UPSELL, score: 0.91 },
    { p: "SRV-SEC-AUDIT", r: "SUB-SIEM-LOGS", type: RelationshipType.UPSELL, score: 0.94 },
    { p: "SRV-CLOUD-MIGRATE", r: "SUB-BACKUP-CLOUD", type: RelationshipType.UPSELL, score: 0.88 },
    { p: "HW-HP-ZBOOK", r: "HW-MON-LG27", type: RelationshipType.CROSS_SELL, score: 0.85 },
    { p: "HW-MAC-MINI", r: "HW-DOCK-TB4", type: RelationshipType.CROSS_SELL, score: 0.90 },
    { p: "STG-SYNOLOGY-NAS", r: "SUB-BACKUP-CLOUD", type: RelationshipType.UPSELL, score: 0.93 },
    { p: "NET-MERAKI-MX105", r: "SUB-VPN-SASE", type: RelationshipType.UPSELL, score: 0.91 },
    { p: "HW-DELL-OPTIPLEX", r: "HW-APC-UPS1500", type: RelationshipType.CROSS_SELL, score: 0.84 },
    { p: "SRV-CISCO-UCS", r: "SRV-SEC-AUDIT", type: RelationshipType.UPSELL, score: 0.86 },
    { p: "NET-UBI-UDMP", r: "NET-ARUBA-CX6300", type: RelationshipType.CROSS_SELL, score: 0.80 },
    { p: "SUB-SEC-SAAS", r: "SUB-AI-COPILOT", type: RelationshipType.UPSELL, score: 0.87 },
    { p: "SUB-SLA-247", r: "SUB-TELEMETRY-ADV", type: RelationshipType.UPSELL, score: 0.92 },
    { p: "HW-JABRA-EVOLVE2", r: "HW-LOGI-MXMASTER", type: RelationshipType.CROSS_SELL, score: 0.83 },
    { p: "HW-APC-UPS1500", r: "SRV-SETUP-ENT", type: RelationshipType.CROSS_SELL, score: 0.79 },
    { p: "SRV-MDM-DEPLOY", r: "SUB-MDM-LICENSE", type: RelationshipType.UPSELL, score: 0.95 },
  ];

  for (const r of rels) {
    if (products[r.p] && products[r.r]) {
      await prisma.productRelationship.create({
        data: {
          productId: products[r.p].id,
          recommendedProductId: products[r.r].id,
          relationshipType: r.type,
          score: r.score,
        },
      });
      totalSeeded++;
    }
  }

  // 7. SEED DISCOUNT GOVERNANCE POLICIES (18 Policies)
  console.log("⚖️ Seeding 18 Discount Governance Policies...");
  const tiers = [bronze, silver, gold, platinum];
  const cats = Object.values(categories);

  for (const t of tiers) {
    for (const c of cats) {
      const maxDisc = t.name === "Bronze" ? 8 : t.name === "Silver" ? 12 : t.name === "Gold" ? 16 : 22;
      await prisma.discountPolicy.create({
        data: {
          customerTierId: t.id,
          categoryId: c.id,
          maxDiscount: maxDisc,
          minMargin: c.name === "Services" ? 35.0 : 20.0,
          priority: 1,
        },
      });
      totalSeeded++;
    }
  }

  // 8. SEED APPROVAL RULES (3 Rules)
  console.log("🚦 Seeding 3 Multi-Level Approval Rules...");
  await prisma.approvalRule.createMany({
    data: [
      { minRiskScore: 0.0, maxRiskScore: 10.0, approvalLevel: 0, requiredRole: Role.SALES_REP, isActive: true },
      { minRiskScore: 10.01, maxRiskScore: 25.0, approvalLevel: 1, requiredRole: Role.SALES_MANAGER, isActive: true },
      { minRiskScore: 25.01, maxRiskScore: 999.0, approvalLevel: 2, requiredRole: Role.FINANCE, isActive: true },
    ],
  });
  totalSeeded += 3;

  // 9. SEED WAREHOUSES (4 Warehouses)
  console.log("🏭 Seeding 4 Regional Warehouses...");
  const wMumbai = await prisma.warehouse.create({ data: { name: "Main Central Hub (Mumbai)", location: "Bhiwandi Logistics Park, Mumbai", shippingWeight: 1.0 } });
  const wBengaluru = await prisma.warehouse.create({ data: { name: "South Regional Depot (Bengaluru)", location: "Electronic City Phase 2, Bengaluru", shippingWeight: 1.1 } });
  const wDelhi = await prisma.warehouse.create({ data: { name: "North Logistics Hub (Delhi-NCR)", location: "Gurugram Cargo Complex, Delhi-NCR", shippingWeight: 1.15 } });
  const wKolkata = await prisma.warehouse.create({ data: { name: "East Regional Depot (Kolkata)", location: "Dankuni Industrial Complex, Kolkata", shippingWeight: 1.25 } });
  totalSeeded += 4;

  const warehouses = [wMumbai, wBengaluru, wDelhi, wKolkata];

  // 10. SEED INVENTORY (80 Inventory Records)
  console.log("📊 Seeding Inventory across warehouses...");
  const hardwareProducts = Object.values(products).filter((p: any) => !p.isRecurring);
  for (const prod of hardwareProducts) {
    for (const wh of warehouses) {
      const avail = Math.floor(20 + Math.random() * 80);
      await prisma.inventory.create({
        data: {
          warehouseId: wh.id,
          productId: prod.id,
          availableQty: avail,
          reservedQty: 0,
          reorderLevel: 10,
        },
      });
      totalSeeded++;
    }
  }

  // 11. SEED SUBSCRIPTION PLANS (5 Plans)
  console.log("🔄 Seeding 5 Subscription Plans...");
  const subPlansData = [
    { name: "Standard Monthly Support", interval: BillingInterval.MONTHLY, price: 3500 },
    { name: "Enterprise Dedicated Support Plan", interval: BillingInterval.MONTHLY, price: 5000 },
    { name: "Quarterly Pro Infrastructure SLA", interval: BillingInterval.QUARTERLY, price: 14000 },
    { name: "Annual Enterprise Security Suite", interval: BillingInterval.YEARLY, price: 50000 },
    { name: "24/7 Dedicated Cloud SLA & Maintenance", interval: BillingInterval.MONTHLY, price: 5000 },
  ];

  const subPlans: Record<string, any> = {};
  for (const sp of subPlansData) {
    subPlans[sp.name] = await prisma.subscriptionPlan.create({
      data: {
        name: sp.name,
        billingInterval: sp.interval,
        price: sp.price,
        prorationEnabled: true,
        refundEnabled: false,
      },
    });
    totalSeeded++;
  }

  // 12. SEED QUOTATIONS, ITEMS, APPROVALS, ORDERS, INVOICES, SUBSCRIPTIONS (25 Quotations)
  console.log("📄 Seeding 25 Full Quotation Lifecycle Records...");

  const statuses = [
    QuotationStatus.DRAFT,
    QuotationStatus.PENDING_MANAGER,
    QuotationStatus.PENDING_FINANCE,
    QuotationStatus.APPROVED,
    QuotationStatus.REJECTED,
    QuotationStatus.UNDER_NEGOTIATION,
    QuotationStatus.CONFIRMED,
    QuotationStatus.CONVERTED_TO_ORDER,
  ];

  const repsList = [users["rep@dealflow360.com"], users["rep2@dealflow360.com"], users["rep3@dealflow360.com"]];

  for (let i = 1; i <= 25; i++) {
    const qNum = `QT-2026-${String(i).padStart(4, "0")}`;
    const cust = customers[(i - 1) % customers.length];
    const rep = repsList[(i - 1) % repsList.length];
    const status = statuses[(i - 1) % statuses.length];

    const p1 = Object.values(products)[(i * 2) % Object.values(products).length];
    const p2 = Object.values(products)[(i * 3) % Object.values(products).length];
    const qty1 = (i % 3) + 2;
    const qty2 = (i % 2) + 1;
    const disc1 = (i * 3) % 18;

    const subtotal = p1.basePrice * qty1 + p2.basePrice * qty2;
    const discAmt = (subtotal * disc1) / 100;
    const taxAmt = ((subtotal - discAmt) * 18) / 100;
    const totalAmt = subtotal - discAmt + taxAmt;

    const costAmt = p1.costPrice * qty1 + p2.costPrice * qty2;
    const marginAmt = subtotal - discAmt - costAmt;
    const marginPct = subtotal > 0 ? (marginAmt / (subtotal - discAmt)) * 100 : 0;
    const riskScore = disc1 > 12 ? 28.5 : disc1 > 8 ? 14.2 : 4.5;

    const custStatus = status === QuotationStatus.REJECTED ? CustomerStatus.DECLINED : status === QuotationStatus.UNDER_NEGOTIATION ? CustomerStatus.COUNTER_PROPOSED : status === QuotationStatus.CONVERTED_TO_ORDER ? CustomerStatus.ACCEPTED : CustomerStatus.VIEWED;

    const quote = await prisma.quotation.create({
      data: {
        quotationNumber: qNum,
        customerId: cust.id,
        salesRepId: rep.id,
        status: status,
        subtotal: subtotal,
        discountAmount: discAmt,
        taxAmount: taxAmt,
        totalAmount: totalAmt,
        costAmount: costAmt,
        marginAmount: marginAmt,
        marginPercentage: marginPct,
        riskScore: riskScore,
        approvalLevel: riskScore > 25 ? 2 : riskScore > 10 ? 1 : 0,
        customerStatus: custStatus,
        createdAt: new Date(Date.now() - i * 86400000 * 2),
      },
    });
    totalSeeded++;

    // Items
    const item1 = await prisma.quotationItem.create({
      data: {
        quotationId: quote.id,
        productId: p1.id,
        quantity: qty1,
        unitPrice: p1.basePrice,
        discountPercentage: disc1,
        discountAmount: (p1.basePrice * qty1 * disc1) / 100,
        taxRate: 18.0,
        lineTotal: p1.basePrice * qty1 * (1 - disc1 / 100) * 1.18,
        costPrice: p1.costPrice,
        marginAmount: p1.basePrice * qty1 * (1 - disc1 / 100) - p1.costPrice * qty1,
        marginPercentage: 25.0,
      },
    });
    totalSeeded++;

    const item2 = await prisma.quotationItem.create({
      data: {
        quotationId: quote.id,
        productId: p2.id,
        quantity: qty2,
        unitPrice: p2.basePrice,
        discountPercentage: 0,
        discountAmount: 0,
        taxRate: 18.0,
        lineTotal: p2.basePrice * qty2 * 1.18,
        costPrice: p2.costPrice,
        marginAmount: p2.basePrice * qty2 - p2.costPrice * qty2,
        marginPercentage: 30.0,
      },
    });
    totalSeeded++;

    // Approvals if needed
    if (status === QuotationStatus.PENDING_MANAGER || status === QuotationStatus.PENDING_FINANCE || status === QuotationStatus.APPROVED) {
      await prisma.approval.create({
        data: {
          quotationId: quote.id,
          level: riskScore > 25 ? 2 : 1,
          approverRole: riskScore > 25 ? Role.FINANCE : Role.SALES_MANAGER,
          approverId: status === QuotationStatus.APPROVED ? users["manager@dealflow360.com"].id : null,
          status: status === QuotationStatus.APPROVED ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING,
          action: status === QuotationStatus.APPROVED ? ApprovalAction.APPROVE : null,
          reason: status === QuotationStatus.APPROVED ? "Discount within authorized tier ceiling." : "Pending commercial margin check.",
        },
      });
      totalSeeded++;
    }

    // Comments & Audit Logs
    if (i % 3 === 0) {
      await prisma.quotationComment.create({
        data: {
          quotationId: quote.id,
          quotationItemId: item1.id,
          authorType: "REP",
          authorId: rep.id,
          comment: `Client requested expedited shipping for ${p1.name}.`,
        },
      });
      totalSeeded++;

      await prisma.auditLog.create({
        data: {
          entityType: "QUOTATION",
          entityId: quote.id,
          action: "SUBMITTED",
          performedBy: rep.id,
          reason: "Submitted for commercial governance review.",
        },
      });
      totalSeeded++;
    }

    // Orders & Fulfillment for CONVERTED or CONFIRMED quotes
    if (status === QuotationStatus.CONVERTED_TO_ORDER || status === QuotationStatus.CONFIRMED) {
      const order = await prisma.order.create({
        data: {
          orderNumber: `ORD-2026-${String(i).padStart(4, "0")}`,
          quotationId: quote.id,
          customerId: cust.id,
          status: OrderStatus.FULFILLED,
          subtotal: subtotal,
          discountAmount: discAmt,
          taxAmount: taxAmt,
          totalAmount: totalAmt,
        },
      });
      totalSeeded++;

      const orderItem1 = await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: p1.id,
          quantity: qty1,
          unitPrice: p1.basePrice,
          discountAmount: (p1.basePrice * qty1 * disc1) / 100,
          taxAmount: taxAmt / 2,
          lineTotal: p1.basePrice * qty1 * (1 - disc1 / 100) * 1.18,
          costPrice: p1.costPrice,
        },
      });
      totalSeeded++;

      // Fulfillments across warehouses
      const ful = await prisma.fulfillment.create({
        data: {
          orderId: order.id,
          warehouseId: wMumbai.id,
          status: FulfillmentStatus.SHIPPED,
          shipmentNumber: `TRK-2026-${Math.floor(100000 + Math.random() * 900000)}`,
          estimatedCost: 1200.0,
          shippedAt: new Date(),
        },
      });
      totalSeeded++;

      await prisma.fulfillmentItem.create({
        data: {
          fulfillmentId: ful.id,
          orderItemId: orderItem1.id,
          productId: p1.id,
          quantity: qty1,
        },
      });
      totalSeeded++;

      // Invoice
      const invStatus = i % 2 === 0 ? InvoiceStatus.PAID : InvoiceStatus.ISSUED;
      const inv = await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-2026-${String(i).padStart(4, "0")}`,
          orderId: order.id,
          customerId: cust.id,
          invoiceType: InvoiceType.ONE_TIME,
          subtotal: subtotal,
          taxAmount: taxAmt,
          totalAmount: totalAmt,
          paidAmount: invStatus === InvoiceStatus.PAID ? totalAmt : 0,
          status: invStatus,
          dueDate: new Date(Date.now() + 30 * 86400000),
          paidAt: invStatus === InvoiceStatus.PAID ? new Date() : null,
        },
      });
      totalSeeded++;

      await prisma.invoiceItem.create({
        data: {
          invoiceId: inv.id,
          productId: p1.id,
          description: p1.name,
          quantity: qty1,
          unitPrice: p1.basePrice,
          discountAmount: (p1.basePrice * qty1 * disc1) / 100,
          taxAmount: taxAmt,
          lineTotal: totalAmt,
        },
      });
      totalSeeded++;

      if (invStatus === InvoiceStatus.PAID) {
        await prisma.payment.create({
          data: {
            invoiceId: inv.id,
            amount: totalAmt,
            paymentMethod: "WIRE_TRANSFER",
            status: PaymentStatus.SUCCESS,
            transactionRef: `TXN-PAY-${Math.floor(100000 + Math.random() * 900000)}`,
          },
        });
        totalSeeded++;
      }

      // Subscriptions if recurring product
      if (p1.isRecurring || p2.isRecurring) {
        const recProd = p1.isRecurring ? p1 : p2;
        const sub = await prisma.subscription.create({
          data: {
            orderId: order.id,
            customerId: cust.id,
            productId: recProd.id,
            planId: subPlans["Enterprise Dedicated Support Plan"].id,
            quantity: 1,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
            nextBillingDate: new Date(Date.now() + 30 * 86400000),
          },
        });
        totalSeeded++;

        await prisma.billingSchedule.create({
          data: {
            subscriptionId: sub.id,
            billingDate: new Date(Date.now() + 30 * 86400000),
            amount: recProd.basePrice,
            status: BillingScheduleStatus.SCHEDULED,
          },
        });
        totalSeeded++;
      }
    }
  }

  // 13. SEED DEAL HEALTH ALERTS (10 Alerts)
  console.log("🚨 Seeding 10 Deal Health & Anomaly Alerts...");
  const alertTypes = [AlertType.STALLED_DEAL, AlertType.DISCOUNT_ANOMALY, AlertType.DELIVERY_SLIPPAGE];
  const severities = [AlertSeverity.LOW, AlertSeverity.MEDIUM, AlertSeverity.HIGH, AlertSeverity.CRITICAL];

  const recentQuotes = await prisma.quotation.findMany({ take: 10 });
  for (let idx = 0; idx < recentQuotes.length; idx++) {
    const q = recentQuotes[idx];
    await prisma.dealAlert.create({
      data: {
        quotationId: q.id,
        alertType: alertTypes[idx % alertTypes.length],
        severity: severities[idx % severities.length],
        title: idx % 2 === 0 ? `Margin Squeeze Warning on ${q.quotationNumber}` : `Stalled Approval Queue on ${q.quotationNumber}`,
        description: `Blended risk score exceeded normal threshold. Automated governance inspection required.`,
        status: idx % 3 === 0 ? AlertStatus.RESOLVED : AlertStatus.OPEN,
        nudgeCount: idx % 4,
      },
    });
    totalSeeded++;
  }

  console.log("--------------------------------------------------");
  console.log(`🎉 DealFlow360 Database Seeding Complete! Total Entries Seeded: ${totalSeeded}`);
  console.log("--------------------------------------------------");
  console.log("🔐 Demo Accounts Ready:");
  console.log("   Admin:       admin@dealflow360.com / password123");
  console.log("   Manager:     manager@dealflow360.com / password123");
  console.log("   Sales Rep:   rep@dealflow360.com / password123");
  console.log("   Finance:     finance@dealflow360.com / password123");
  console.log("   Customer:    procurement@acme.com (Token: acme_portal_demo_token_2026)");
  console.log("--------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Critical error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
