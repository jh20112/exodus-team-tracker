import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

const members = [
  { name: "Sam", color: "#9cb8c2" },
  { name: "Nin", color: "#c29cb0" },
  { name: "Emilie", color: "#9cc2a8" },
  { name: "Jacob", color: "#c2b89c" },
];

async function main() {
  for (const member of members) {
    await prisma.teamMember.upsert({
      where: { name: member.name },
      update: { color: member.color },
      create: member,
    });
  }
  console.log("Seeded team members:", members.map((m) => m.name).join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
