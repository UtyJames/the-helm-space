import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
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
  for (const p of PACKAGES) {
    await prisma.package.upsert({
      where: { key: p.key },
      update: { label: p.label, sublabel: p.sublabel, price: p.price, origPrice: p.origPrice, unit: p.unit, custom: p.custom },
      create: p,
    });
  }

  const owner = await prisma.user.upsert({
    where: { username: "owner" },
    update: {},
    create: {
      username: "owner",
      name: "Space Owner",
      password: await bcrypt.hash("Helm2026!Owner", 12),
      role: "SUPER_ADMIN",
    },
  });

  const desk = await prisma.user.upsert({
    where: { username: "frontdesk" },
    update: {},
    create: {
      username: "frontdesk",
      name: "Front Desk",
      password: await bcrypt.hash("Helm2026!Desk", 12),
      role: "RECEPTIONIST",
    },
  });

  console.log("Seeded packages:", PACKAGES.length);
  console.log("Seeded users:", owner.username, "(SUPER_ADMIN),", desk.username, "(RECEPTIONIST)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
