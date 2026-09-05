import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PACKAGES = [
  { key: "monthly-standard", label: "The Helm Monthly Package", sublabel: null, price: 70000, origPrice: 75000, unit: "/month", custom: false },
  { key: "monthly-premium", label: "The Helm Monthly Package", sublabel: "Premium", price: 80000, origPrice: 85000, unit: "/month", custom: false },
  { key: "weekend", label: "The Helm Weekend Package", sublabel: null, price: 12000, origPrice: null, unit: "/weekend", custom: false },
  { key: "team-desks", label: "Team Desks", sublabel: "Shared Desk - team of 4", price: 11000, origPrice: 12500, unit: "/month", custom: false },
  { key: "meeting-room", label: "Meeting Room", sublabel: "9 seats", price: 15000, origPrice: 25000, unit: "/session", custom: false },
  { key: "hall", label: "The Helm Space Hall", sublabel: "For Rent", price: 80000, origPrice: 100000, unit: "/day", custom: false },
  { key: "daily-dedicated", label: "Daily Pass", sublabel: "Dedicated Desk", price: 2000, origPrice: 4000, unit: "/day", custom: false },
  { key: "daily-shared", label: "Daily Pass", sublabel: "Shared Table", price: 1500, origPrice: 3500, unit: "/day", custom: false },
  { key: "custom", label: "Custom Date Pass", sublabel: "Shared Table - pick your days", price: 1500, origPrice: null, unit: "/day", custom: true },
];

async function main() {
  console.log("Seeding packages...");
  for (const p of PACKAGES) {
    await prisma.package.upsert({
      where: { key: p.key },
      update: { label: p.label, sublabel: p.sublabel, price: p.price, origPrice: p.origPrice, unit: p.unit, custom: p.custom },
      create: p,
    });
  }

  console.log("Seeding users...");
  // Super User requested by user: Utibe james / Utyjames@25
  const utibe = await prisma.user.upsert({
    where: { username: "Utibe james" },
    update: {
      password: "Utyjames@25",
      role: "SUPER_ADMIN",
      active: true,
    },
    create: {
      username: "Utibe james",
      name: "Utibe James",
      password: "Utyjames@25",
      pin: "2525",
      role: "SUPER_ADMIN",
    },
  });

  const owner = await prisma.user.upsert({
    where: { username: "owner" },
    update: {},
    create: {
      username: "owner",
      name: "Space Owner",
      password: "Helm2026!Owner",
      pin: "0000",
      role: "SUPER_ADMIN",
    },
  });

  const desk = await prisma.user.upsert({
    where: { username: "frontdesk" },
    update: {},
    create: {
      username: "frontdesk",
      name: "Front Desk",
      password: "Helm2026!Desk",
      pin: "1234",
      role: "RECEPTIONIST",
    },
  });

  console.log("✓ Seeded packages:", PACKAGES.length);
  console.log("✓ Seeded users:", utibe.username, "(SUPER_ADMIN),", owner.username, "(SUPER_ADMIN),", desk.username, "(RECEPTIONIST)");
  console.log("\nDefault credentials:");
  console.log("  Utibe james → password: Utyjames@25     PIN: 2525 (SUPER_ADMIN)");
  console.log("  owner       → password: Helm2026!Owner  PIN: 0000 (SUPER_ADMIN)");
  console.log("  frontdesk   → password: Helm2026!Desk   PIN: 1234 (RECEPTIONIST)");
}

main()
  .catch((e) => { console.error("Seed error:", e); process.exit(1); })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
