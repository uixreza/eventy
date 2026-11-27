/**
 * Creates — or promotes — the one account that may open `/console`.
 *
 *   ADMIN_PHONE=09123456789 npm run seed:admin
 *
 * Without ADMIN_PHONE a placeholder number is used; change it with a second
 * run once you know the real phone. Everyone else stays `USER`.
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const phone = process.env.ADMIN_PHONE ?? "09120000000";

if (!/^09\d{9}$/.test(phone)) {
  console.error(`ADMIN_PHONE must be an 11-digit Iranian mobile number, got: ${phone}`);
  process.exit(1);
}

try {
  const user = await prisma.user.upsert({
    where: { phone },
    update: { role: "ADMIN" },
    create: {
      phone,
      name: process.env.ADMIN_NAME ?? "مدیر Kooja",
      nationalId: "0012345679",
      birthDate: new Date("1990-01-01T00:00:00.000Z"),
      role: "ADMIN",
    },
  });

  console.log(`admin ready → ${user.name} (${user.phone}) · role: ${user.role}`);
} catch (error) {
  console.error("seed failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
