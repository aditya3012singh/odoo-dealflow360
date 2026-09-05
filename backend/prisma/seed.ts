import "dotenv/config";
import { PrismaClient, Role, RelationshipType } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding DealFlow360 Database...");

  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  // 1. SEED USERS & ROLES
  console.log("👥 Seeding Users with DealFlow360 Roles...");
  const admin = await prisma.user.upsert({
    where: { email: "admin@dealflow360.com" },
    update: { role: Role.ADMIN, password: defaultPasswordHash },
    create: {
      email: "admin@dealflow360.com",
      username: "System Admin",
      password: defaultPasswordHash,
      role: Role.ADMIN,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@dealflow360.com" },
    update: { role: Role.SALES_MANAGER, password: defaultPasswordHash },
    create: {
      email: "manager@dealflow360.com",
      username: "Marcus Vance (Sales Manager)",
      password: defaultPasswordHash,
      role: Role.SALES_MANAGER,
    },
  });

  const rep = await prisma.user.upsert({
    where: { email: "rep@dealflow360.com" },
    update: { role: Role.SALES_REP, password: defaultPasswordHash },
    create: {
      email: "rep@dealflow360.com",
      username: "Sarah Jenkins (Senior Rep)",
      password: defaultPasswordHash,
      role: Role.SALES_REP,
    },
  });

  const finance = await prisma.user.upsert({
    where: { email: "finance@dealflow360.com" },
    update: { role: Role.FINANCE, password: defaultPasswordHash },
    create: {
      email: "finance@dealflow360.com",
      username: "Fiona Sterling (Finance Controller)",
      password: defaultPasswordHash,
      role: Role.FINANCE,
    },
  });

  // 2. SEED CUSTOMER TIERS
  console.log("🏅 Seeding Customer Tiers...");
  const bronzeTier = await prisma.customerTier.upsert({
    where: { name: "Bronze" },
    update: { defaultDiscount: 5.0 },
    create: {
      name: "Bronze",
      defaultDiscount: 5.0,
      description: "Standard starter accounts with baseline 5% discount allowance.",
    },
  });

  const silverTier = await prisma.customerTier.upsert({
    where: { name: "Silver" },
    update: { defaultDiscount: 10.0 },
    create: {
      name: "Silver",
      defaultDiscount: 10.0,
      description: "Mid-market accounts with 10% baseline discount allowance.",
    },
  });

  const goldTier = await prisma.customerTier.upsert({
    where: { name: "Gold" },
    update: { defaultDiscount: 15.0 },
    create: {
      name: "Gold",
      defaultDiscount: 15.0,
      description: "Strategic enterprise accounts with 15% discount allowance.",
    },
  });

  // 3. SEED CUSTOMERS
  console.log("🏢 Seeding Customers...");
  const acmeCustomer = await prisma.customer.upsert({
    where: { email: "procurement@acme.com" },
    update: { customerTierId: goldTier.id },
    create: {
      name: "Arthur Pendelton",
      email: "procurement@acme.com",
      phone: "+91 98765 43210",
      companyName: "Acme Global Industries",
      customerTierId: goldTier.id,
      portalEnabled: true,
      portalToken: "portal_acme_strategic_token",
    },
  });

  const betaCustomer = await prisma.customer.upsert({
    where: { email: "buyer@betatech.io" },
    update: { customerTierId: silverTier.id },
    create: {
      name: "Elena Rostova",
      email: "buyer@betatech.io",
      phone: "+91 98765 12345",
      companyName: "Beta Technologies Corp",
      customerTierId: silverTier.id,
      portalEnabled: true,
      portalToken: "portal_beta_token",
    },
  });

  // 4. SEED CATEGORIES
  console.log("📦 Seeding Product Categories...");
  const hardwareCat = await prisma.category.upsert({
    where: { name: "Hardware" },
    update: {},
    create: {
      name: "Hardware",
      description: "High performance laptops, enterprise workstations, and peripherals.",
    },
  });

  const servicesCat = await prisma.category.upsert({
    where: { name: "Services" },
    update: {},
    create: {
      name: "Services",
      description: "Professional deployment, architecture consultation, and on-site setup.",
    },
  });

  const subsCat = await prisma.category.upsert({
    where: { name: "Subscriptions" },
    update: {},
    create: {
      name: "Subscriptions",
      description: "Recurring SaaS licenses, 24/7 cloud support, and SLA packages.",
    },
  });

  // 5. SEED PRODUCTS
  console.log("💻 Seeding Products (Base and Cost prices)...");
  const laptop = await prisma.product.upsert({
    where: { sku: "HW-MBP-16" },
    update: { basePrice: 150000.0, costPrice: 110000.0 },
    create: {
      sku: "HW-MBP-16",
      name: "MacBook Pro M3 Max (36GB / 1TB)",
      categoryId: hardwareCat.id,
      description: "Flagship engineering workstation with 16-core CPU and 40-core GPU.",
      basePrice: 150000.0,
      costPrice: 110000.0, // ₹40,000 base gross margin (26.7%)
      unit: "unit",
      taxRate: 18.0,
      isRecurring: false,
    },
  });

  const setupService = await prisma.product.upsert({
    where: { sku: "SRV-SETUP-ENT" },
    update: { basePrice: 30000.0, costPrice: 15000.0 },
    create: {
      sku: "SRV-SETUP-ENT",
      name: "Enterprise Onboarding & Security Setup",
      categoryId: servicesCat.id,
      description: "MDM configuration, custom VPN profiles, and on-site hardware provisioning.",
      basePrice: 30000.0,
      costPrice: 15000.0, // ₹15,000 base margin (50%)
      unit: "package",
      taxRate: 18.0,
      isRecurring: false,
    },
  });

  const dock = await prisma.product.upsert({
    where: { sku: "HW-DOCK-TB4" },
    update: { basePrice: 12000.0, costPrice: 7000.0 },
    create: {
      sku: "HW-DOCK-TB4",
      name: "Thunderbolt 4 Triple-Display Dock",
      categoryId: hardwareCat.id,
      description: "Dual 4K 120Hz display outputs, 100W Power Delivery, and 2.5GbE LAN.",
      basePrice: 12000.0,
      costPrice: 7000.0, // ₹5,000 margin
      unit: "unit",
      taxRate: 18.0,
      isRecurring: false,
    },
  });

  const cloudSupport = await prisma.product.upsert({
    where: { sku: "SUB-SLA-247" },
    update: { basePrice: 5000.0, costPrice: 1800.0 },
    create: {
      sku: "SUB-SLA-247",
      name: "24/7 Dedicated Cloud SLA & Maintenance",
      categoryId: subsCat.id,
      description: "15-minute guaranteed response time, monthly security audit, dedicated engineer.",
      basePrice: 5000.0,
      costPrice: 1800.0,
      unit: "month",
      taxRate: 18.0,
      isRecurring: true, // Hybrid recurring billing line
    },
  });

  // 6. SEED UPSELL / CROSS-SELL RELATIONSHIPS
  console.log("🔗 Seeding Upsell & Cross-Sell Recommendations...");
  await prisma.productRelationship.upsert({
    where: {
      productId_recommendedProductId: {
        productId: laptop.id,
        recommendedProductId: dock.id,
      },
    },
    update: { score: 0.94 },
    create: {
      productId: laptop.id,
      recommendedProductId: dock.id,
      relationshipType: RelationshipType.CROSS_SELL,
      score: 0.94,
    },
  });

  await prisma.productRelationship.upsert({
    where: {
      productId_recommendedProductId: {
        productId: laptop.id,
        recommendedProductId: cloudSupport.id,
      },
    },
    update: { score: 0.88 },
    create: {
      productId: laptop.id,
      recommendedProductId: cloudSupport.id,
      relationshipType: RelationshipType.UPSELL,
      score: 0.88,
    },
  });

  // 7. SEED DISCOUNT GOVERNANCE POLICIES
  console.log("⚖️ Seeding Discount Governance Policies...");
  // Gold Tier + Hardware: max 15% discount
  await prisma.discountPolicy.create({
    data: {
      customerTierId: goldTier.id,
      categoryId: hardwareCat.id,
      maxDiscount: 15.0,
      minMargin: 20.0,
      priority: 1,
    },
  });

  // Gold Tier + Services: max 10% discount (Strict ceiling to trigger risk on 18% discount!)
  await prisma.discountPolicy.create({
    data: {
      customerTierId: goldTier.id,
      categoryId: servicesCat.id,
      maxDiscount: 10.0,
      minMargin: 35.0,
      priority: 1,
    },
  });

  // Silver Tier policies
  await prisma.discountPolicy.create({
    data: {
      customerTierId: silverTier.id,
      categoryId: hardwareCat.id,
      maxDiscount: 10.0,
      minMargin: 22.0,
      priority: 1,
    },
  });

  // 8. SEED APPROVAL RULES
  console.log("🚦 Seeding Multi-Level Approval Rules...");
  await prisma.approvalRule.createMany({
    data: [
      {
        minRiskScore: 0.0,
        maxRiskScore: 10.0,
        approvalLevel: 0,
        requiredRole: Role.SALES_REP,
        isActive: true,
      },
      {
        minRiskScore: 10.01,
        maxRiskScore: 25.0,
        approvalLevel: 1,
        requiredRole: Role.SALES_MANAGER,
        isActive: true,
      },
      {
        minRiskScore: 25.01,
        maxRiskScore: 999.0,
        approvalLevel: 2,
        requiredRole: Role.FINANCE,
        isActive: true,
      },
    ],
  });

  // 9. SEED WAREHOUSES & INVENTORY ALLOCATION
  console.log("🏭 Seeding Multi-Warehouse Inventory (100 total units)...");
  const mainWarehouse = await prisma.warehouse.upsert({
    where: { name: "Main Central Hub (Mumbai)" },
    update: {},
    create: {
      name: "Main Central Hub (Mumbai)",
      location: "Bhiwandi Logistics Park, Mumbai",
      shippingWeight: 1.0, // Baseline freight cost multiplier
    },
  });

  const eastWarehouse = await prisma.warehouse.upsert({
    where: { name: "East Regional Depot (Kolkata)" },
    update: {},
    create: {
      name: "East Regional Depot (Kolkata)",
      location: "Dankuni Industrial Complex, Kolkata",
      shippingWeight: 1.25, // 25% higher freight cost multiplier
    },
  });

  // Main Warehouse stock: 60 laptops
  await prisma.inventory.upsert({
    where: {
      warehouseId_productId: {
        warehouseId: mainWarehouse.id,
        productId: laptop.id,
      },
    },
    update: { availableQty: 60.0, reservedQty: 0.0 },
    create: {
      warehouseId: mainWarehouse.id,
      productId: laptop.id,
      availableQty: 60.0,
      reservedQty: 0.0,
      reorderLevel: 15.0,
    },
  });

  // East Warehouse stock: 40 laptops
  // Total across warehouses = 60 + 40 = 100 units! Exactly tests order of 100 laptops splitting!
  await prisma.inventory.upsert({
    where: {
      warehouseId_productId: {
        warehouseId: eastWarehouse.id,
        productId: laptop.id,
      },
    },
    update: { availableQty: 40.0, reservedQty: 0.0 },
    create: {
      warehouseId: eastWarehouse.id,
      productId: laptop.id,
      availableQty: 40.0,
      reservedQty: 0.0,
      reorderLevel: 10.0,
    },
  });

  // Docks stock
  await prisma.inventory.upsert({
    where: {
      warehouseId_productId: {
        warehouseId: mainWarehouse.id,
        productId: dock.id,
      },
    },
    update: { availableQty: 150.0 },
    create: {
      warehouseId: mainWarehouse.id,
      productId: dock.id,
      availableQty: 150.0,
      reservedQty: 0.0,
    },
  });

  // 10. SEED SUBSCRIPTION PLANS
  console.log("🔄 Seeding Subscription Plans for Hybrid Billing...");
  await prisma.subscriptionPlan.upsert({
    where: { name: "Enterprise Dedicated Support Plan" },
    update: { price: 5000.0 },
    create: {
      name: "Enterprise Dedicated Support Plan",
      billingInterval: "MONTHLY",
      price: 5000.0,
      prorationEnabled: true,
      refundEnabled: false,
    },
  });

  console.log("✅ DealFlow360 Database Seeding Complete! All 8 Demo flow entities ready.");
}

main()
  .catch((e) => {
    console.error("❌ Critical error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
