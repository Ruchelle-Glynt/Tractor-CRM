// Seeds the fixed Category taxonomy (spec Section 4.1) and the initial Admin
// users (spec Section 4.9) for the Tractor Outdoor instance.
//
// Run with: npm run prisma:seed
// (this also runs automatically after `prisma migrate dev` the first time)

import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Main category -> list of subcategories. Categories with no subcategories
// get a single row with subcategory = null.
const CATEGORY_TAXONOMY: Record<string, string[]> = {
  "Financial Services": ["Retail Banking", "Business Banking", "Financial Management", "Insurance", "Other"],
  "Beverages": [
    "Carbonated Beverages",
    "Alcoholic Beverages",
    "Coffee",
    "Energy Drinks",
    "Milk",
    "Fruit Juices",
    "Water",
    "Other",
  ],
  "Technology": ["Computer Software", "Computer Hardware", "Security Services and Systems", "Solar", "Other"],
  "Telecommunication": ["Cellular Networks", "Cellular Phones"],
  "Education, Government, Welfare and Health": [
    "Government",
    "Schools",
    "Colleges and University",
    "Medical Services",
    "Political Party",
    "Social Welfare",
    "Other",
  ],
  "Food": [],
  "Health and Beauty": ["Pharmaceuticals", "Beauty and Skincare", "Luxury", "Other"],
  "Household": [],
  "Media and Entertainment": [],
  "Retail": [
    "Clothing and Shoes",
    "Liquor",
    "Supermarkets",
    "Pharmacy",
    "Electronics",
    "Fast Food and Restaurants",
    "Furniture",
    "Hardware",
    "Jewellery and Watches",
    "Online Retailer",
    "Pets",
    "Other",
  ],
  "Travel and Leisure": ["Airlines", "Betting", "Hotels and Resorts", "Holidays", "Other"],
  "Cars": ["Car Dealers", "Car Brands", "Other"],
  "Other": [],
};

// Admins named in the spec (Section 4.9). Emails and passwords below are
// PLACEHOLDERS - change every one of them before this touches real use.
// Passwords are hashed, never stored in plain text.
const INITIAL_ADMINS = [
  { name: "Ruchelle", email: "ruchelle@tractoroutdoor.com" },
  { name: "Bernice", email: "bernice@tractoroutdoor.com" },
  { name: "Seymone", email: "seymone@tractoroutdoor.com" },
];
const PLACEHOLDER_PASSWORD = "ChangeMe123!"; // every admin should reset this on first login

async function main() {
  console.log("Seeding Category taxonomy...");
  for (const [mainCategory, subcategories] of Object.entries(CATEGORY_TAXONOMY)) {
    if (subcategories.length === 0) {
      await prisma.category.upsert({
        where: { mainCategory_subcategory: { mainCategory, subcategory: null } },
        update: {},
        create: { mainCategory, subcategory: null },
      });
    } else {
      for (const subcategory of subcategories) {
        await prisma.category.upsert({
          where: { mainCategory_subcategory: { mainCategory, subcategory } },
          update: {},
          create: { mainCategory, subcategory },
        });
      }
    }
  }

  console.log("Seeding initial Admin users...");
  const passwordHash = await bcrypt.hash(PLACEHOLDER_PASSWORD, 10);
  for (const admin of INITIAL_ADMINS) {
    await prisma.user.upsert({
      where: { email: admin.email },
      update: {},
      create: {
        name: admin.name,
        email: admin.email,
        passwordHash,
        role: UserRole.ADMIN,
      },
    });
  }

  console.log("Done. Placeholder admin password is:", PLACEHOLDER_PASSWORD);
  console.log("Change every admin's email/password before real use.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
