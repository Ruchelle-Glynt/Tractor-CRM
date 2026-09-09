// One-time fix-up: resets Tier and Category on the Accounts created by
// prisma/import-birthdays.ts back to "unassigned" placeholders.
//
// Why: the original import guessed Tier 3 and a "Media and Entertainment"
// category for every new Account. That was wrong - Tier and Category should
// be left for a human to set, and Category only ever applies to Client/brand
// accounts, never Agencies. Run this once, after applying the schema change
// that makes AccountTier.TO_BE_ASSIGNED and Account.categoryId optional.
//
// Run with: npx tsx prisma/fix-import-defaults.ts

import { PrismaClient, AccountTier } from "@prisma/client";

const prisma = new PrismaClient();

const IMPORTED_ACCOUNT_NAMES: string[] = [
  "Burger King",
  "Havas MG",
  "Meta Media - JHB",
  "Publicis Jhb",
  "Phd Cpt",
  "Phd Jhb",
  "M&C Connect",
  "Starcom",
  "OMD",
  "Joe Public",
  "UMWW",
  "Mediashop",
  "Coty Cosmetics",
  "Fox Five Media",
  "POLO Clothing",
  "Carat Jhb",
  "UM",
  "Unassigned / No Company Listed",
  "Naked Insurance",
  "Initiative Media",
  "Hurley",
  "Dotsure",
  "Penquin",
  "Universal Paints",
  "Sunglass Hut",
  "Meta Media - CPT",
  "Torque Media",
  "Indigo Brands (Pty) Ltd",
  "Amplify",
  "OMG Jhb",
  "Zenith",
  "Mediology",
  "Dentsu",
  "Fame Media",
  "Ivie Media",
  "Planit Media",
  "Independent",
  "Beauty Fires",
  "Western Cape Blood Services",
  "Kintaro",
  "Prestige Cosmetics",
  "The Sharpest Pencil",
  "VOYS Telecoms",
  "Six Sense Marketing",
  "Media Mix 360",
  "Verto.com",
  "Mandelabay Theatre",
  "Yoco",
  "Park Advertising",
  "Superdry Clothing",
  "PMAC",
  "Vizeum",
  "Pick n Pay",
  "MediaMerge",
  "e.tv",
  "iProspect",
  "Mediamix 360 CPT",
  "Adidas",
  "TK Analytics",
  "Posterscope",
  "OISHI",
  "M Carr Media",
  "Sunbet",
  "Bloudruk Media",
  "Dentsu Cpt",
  "Magnate Media",
  "Dotline",
  "World Sports Betting",
  "Topex",
  "SmartOutAds",
  "Carat Cpt",
  "Pineapple Insurance",
  "TMS",
  "DROPPA",
  "OMG Durban",
  "Wavemakers",
  "Betway",
  "99c",
  "MJ Media",
  "Brandright",
  "Primedia Broadcasting",
  "Duck 'n Craig",
  "Hi-Tec",
  "Connect Media Group",
  "MSC Sports",
  "Clicks",
  "Hirsch's",
  "SEDGARS HOME",
  "SOLY",
  "Aliens Nation",
  "ZOHO",
  "Toyota Team (Publicis)",
  "Publicis (Research and Insights)",
  "Nestle Media Team (Publicis)"
];

async function main() {
  let updated = 0;
  for (const name of IMPORTED_ACCOUNT_NAMES) {
    const result = await prisma.account.updateMany({
      where: { name: { equals: name, mode: "insensitive" } },
      data: {
        tier: AccountTier.TO_BE_ASSIGNED,
        categoryId: null,
        subcategoryId: null,
      },
    });
    updated += result.count;
  }
  console.log(`Reset Tier and Category on ${updated} accounts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
