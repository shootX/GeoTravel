import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { initializeCmsData } from "../server/lib/cms/initializeCms";
import { seedAiDefaults } from "../server/lib/ai/seedAi";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@voya.ai";
const DEMO_PASSWORD = "Demo1234";
const DEMO_NAME = "Demo Traveler";

const ADMIN_EMAIL = "admin@voya.ai";
const ADMIN_PASSWORD = "Admin1234";
const ADMIN_NAME = "CMS Admin";

async function main(): Promise<void> {
  const demoHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      passwordHash: demoHash,
      name: DEMO_NAME,
      emailVerified: true,
      role: "USER",
    },
    create: {
      email: DEMO_EMAIL,
      passwordHash: demoHash,
      name: DEMO_NAME,
      emailVerified: true,
      role: "USER",
    },
  });

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      passwordHash: adminHash,
      name: ADMIN_NAME,
      emailVerified: true,
      role: "ADMIN",
    },
    create: {
      email: ADMIN_EMAIL,
      passwordHash: adminHash,
      name: ADMIN_NAME,
      emailVerified: true,
      role: "ADMIN",
    },
  });

  await initializeCmsData();
  await seedAiDefaults();

  console.log("Demo user ready:");
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log("");
  console.log("Admin CMS user ready:");
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
