import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@logiccrm.com";
  const password = await bcrypt.hash("Admin@123", 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "System Admin",
      email,
      password,
      role: "ADMIN",
      mobileNo: [],
    },
  });

  console.log("✔ Seeded admin user");
  console.log(`  email:    ${admin.email}`);
  console.log(`  password: Admin@123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
