// One-time import script: Client Birthday List -> Accounts + Contacts
// Run with: npx tsx prisma/import-birthdays.ts
//
// What this does:
// - Creates an Account for each company/agency found in the spreadsheet
//   (skips creating one if an Account with that exact name already exists)
// - Creates a Contact under the right Account for every person, with their
//   birthday and job title carried over
//
// Defaults used for fields the spreadsheet didn't have (Tier, Category,
// Fiscal Year, Sales Executive) - review and correct these in the app
// afterwards:
//   - tier: TIER_3
//   - category: "Media and Entertainment"
//   - fiscalYearStart: TO_BE_ASSIGNED
//   - salesExecutive: split evenly across the Sales team, round-robin
//
// Account "type" (Agency vs Client) was guessed from the company name.
// Double check the ones flagged as CLIENT below - a few (like small
// production/creative agencies) may actually be agencies.

import { PrismaClient, AccountType, AccountTier, FiscalYearStart } from "@prisma/client";

const prisma = new PrismaClient();

const COMPANIES: { name: string; type: "AGENCY" | "CLIENT" }[] = [
  {
    "name": "Burger King",
    "type": "CLIENT"
  },
  {
    "name": "Havas MG",
    "type": "AGENCY"
  },
  {
    "name": "Meta Media - JHB",
    "type": "AGENCY"
  },
  {
    "name": "Publicis Jhb",
    "type": "AGENCY"
  },
  {
    "name": "Phd Cpt",
    "type": "AGENCY"
  },
  {
    "name": "Phd Jhb",
    "type": "AGENCY"
  },
  {
    "name": "M&C Connect",
    "type": "AGENCY"
  },
  {
    "name": "Starcom",
    "type": "AGENCY"
  },
  {
    "name": "OMD",
    "type": "AGENCY"
  },
  {
    "name": "Joe Public",
    "type": "AGENCY"
  },
  {
    "name": "UMWW",
    "type": "AGENCY"
  },
  {
    "name": "Mediashop",
    "type": "AGENCY"
  },
  {
    "name": "Coty Cosmetics",
    "type": "CLIENT"
  },
  {
    "name": "Fox Five Media",
    "type": "AGENCY"
  },
  {
    "name": "POLO Clothing",
    "type": "CLIENT"
  },
  {
    "name": "Carat Jhb",
    "type": "AGENCY"
  },
  {
    "name": "UM",
    "type": "AGENCY"
  },
  {
    "name": "Unknown / No Company Listed",
    "type": "CLIENT"
  },
  {
    "name": "Naked Insurance",
    "type": "CLIENT"
  },
  {
    "name": "Initiative Media",
    "type": "AGENCY"
  },
  {
    "name": "Hurley",
    "type": "CLIENT"
  },
  {
    "name": "Dotsure",
    "type": "CLIENT"
  },
  {
    "name": "Penquin",
    "type": "CLIENT"
  },
  {
    "name": "Universal Paints",
    "type": "CLIENT"
  },
  {
    "name": "Sunglass Hut",
    "type": "CLIENT"
  },
  {
    "name": "Meta Media - CPT",
    "type": "AGENCY"
  },
  {
    "name": "Torque Media",
    "type": "AGENCY"
  },
  {
    "name": "Indigo Brands (Pty) Ltd",
    "type": "CLIENT"
  },
  {
    "name": "Amplify",
    "type": "AGENCY"
  },
  {
    "name": "OMG Jhb",
    "type": "AGENCY"
  },
  {
    "name": "Zenith",
    "type": "AGENCY"
  },
  {
    "name": "Mediology",
    "type": "AGENCY"
  },
  {
    "name": "Dentsu",
    "type": "AGENCY"
  },
  {
    "name": "Fame Media",
    "type": "AGENCY"
  },
  {
    "name": "Ivie Media",
    "type": "AGENCY"
  },
  {
    "name": "Planit Media",
    "type": "AGENCY"
  },
  {
    "name": "Independent",
    "type": "CLIENT"
  },
  {
    "name": "Beauty Fires",
    "type": "CLIENT"
  },
  {
    "name": "Western Cape Blood Services",
    "type": "CLIENT"
  },
  {
    "name": "Kintaro",
    "type": "AGENCY"
  },
  {
    "name": "Prestige Cosmetics",
    "type": "CLIENT"
  },
  {
    "name": "The Sharpest Pencil",
    "type": "AGENCY"
  },
  {
    "name": "VOYS Telecoms",
    "type": "CLIENT"
  },
  {
    "name": "Six Sense Marketing",
    "type": "AGENCY"
  },
  {
    "name": "Media Mix 360",
    "type": "AGENCY"
  },
  {
    "name": "Verto.com",
    "type": "CLIENT"
  },
  {
    "name": "Mandelabay Theatre",
    "type": "CLIENT"
  },
  {
    "name": "Yoco",
    "type": "CLIENT"
  },
  {
    "name": "Park Advertising",
    "type": "AGENCY"
  },
  {
    "name": "Superdry Clothing",
    "type": "CLIENT"
  },
  {
    "name": "PMAC",
    "type": "AGENCY"
  },
  {
    "name": "Vizeum",
    "type": "AGENCY"
  },
  {
    "name": "Pick n Pay",
    "type": "CLIENT"
  },
  {
    "name": "MediaMerge",
    "type": "AGENCY"
  },
  {
    "name": "e.tv",
    "type": "CLIENT"
  },
  {
    "name": "iProspect",
    "type": "AGENCY"
  },
  {
    "name": "Mediamix 360 CPT",
    "type": "AGENCY"
  },
  {
    "name": "Adidas",
    "type": "CLIENT"
  },
  {
    "name": "TK Analytics",
    "type": "CLIENT"
  },
  {
    "name": "Posterscope",
    "type": "AGENCY"
  },
  {
    "name": "OISHI",
    "type": "CLIENT"
  },
  {
    "name": "M Carr Media",
    "type": "AGENCY"
  },
  {
    "name": "Sunbet",
    "type": "CLIENT"
  },
  {
    "name": "Bloudruk Media",
    "type": "AGENCY"
  },
  {
    "name": "Dentsu Cpt",
    "type": "AGENCY"
  },
  {
    "name": "Magnate Media",
    "type": "AGENCY"
  },
  {
    "name": "Dotline",
    "type": "CLIENT"
  },
  {
    "name": "World Sports Betting",
    "type": "CLIENT"
  },
  {
    "name": "Topex",
    "type": "CLIENT"
  },
  {
    "name": "SmartOutAds",
    "type": "AGENCY"
  },
  {
    "name": "Carat Cpt",
    "type": "AGENCY"
  },
  {
    "name": "Pineapple Insurance",
    "type": "CLIENT"
  },
  {
    "name": "TMS",
    "type": "AGENCY"
  },
  {
    "name": "DROPPA",
    "type": "CLIENT"
  },
  {
    "name": "OMG Durban",
    "type": "AGENCY"
  },
  {
    "name": "Wavemakers",
    "type": "AGENCY"
  },
  {
    "name": "Betway",
    "type": "CLIENT"
  },
  {
    "name": "99c",
    "type": "CLIENT"
  },
  {
    "name": "MJ Media",
    "type": "AGENCY"
  },
  {
    "name": "Brandright",
    "type": "AGENCY"
  },
  {
    "name": "Primedia Broadcasting",
    "type": "AGENCY"
  },
  {
    "name": "Duck 'n Craig",
    "type": "CLIENT"
  },
  {
    "name": "Hi-Tec",
    "type": "CLIENT"
  },
  {
    "name": "Connect Media Group",
    "type": "AGENCY"
  },
  {
    "name": "MSC Sports",
    "type": "AGENCY"
  },
  {
    "name": "Clicks",
    "type": "CLIENT"
  },
  {
    "name": "Hirsch's",
    "type": "CLIENT"
  },
  {
    "name": "SEDGARS HOME",
    "type": "AGENCY"
  },
  {
    "name": "SOLY",
    "type": "CLIENT"
  },
  {
    "name": "Aliens Nation",
    "type": "CLIENT"
  },
  {
    "name": "ZOHO",
    "type": "CLIENT"
  },
  {
    "name": "Toyota Team (Publicis)",
    "type": "AGENCY"
  },
  {
    "name": "Publicis (Research and Insights)",
    "type": "AGENCY"
  },
  {
    "name": "Nestle Media Team (Publicis)",
    "type": "AGENCY"
  }
];

const CONTACTS: {
  company: string;
  type: string;
  firstName: string;
  lastName: string;
  title: string | null;
  birthday: string | null;
}[] = [
  {
    "company": "Burger King",
    "type": "CLIENT",
    "firstName": "Inoba",
    "lastName": "Siwundla",
    "title": "Marketing Manager",
    "birthday": "2025-01-02"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Veronica",
    "lastName": "Modieginyana",
    "title": "Digital Campaign Manager",
    "birthday": "2025-01-02"
  },
  {
    "company": "Meta Media - JHB",
    "type": "AGENCY",
    "firstName": "Zakhiyya",
    "lastName": "Khan",
    "title": "Media Strategist",
    "birthday": "2025-01-02"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Wasanga",
    "lastName": "Mehana",
    "title": "Search Specialist",
    "birthday": "2026-01-03"
  },
  {
    "company": "Phd Cpt",
    "type": "AGENCY",
    "firstName": "Zane",
    "lastName": "Fourie",
    "title": "Performance Strategist",
    "birthday": "2025-01-04"
  },
  {
    "company": "Phd Jhb",
    "type": "AGENCY",
    "firstName": "Rene",
    "lastName": "Jonck",
    "title": "Account Lead",
    "birthday": "2025-01-05"
  },
  {
    "company": "M&C Connect",
    "type": "AGENCY",
    "firstName": "Scott",
    "lastName": "Reinders",
    "title": "Digital Media Partner",
    "birthday": "2025-01-05"
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Unathi",
    "lastName": "msezane",
    "title": "Junior Digital Media Planner",
    "birthday": "2026-01-06"
  },
  {
    "company": "OMD",
    "type": "AGENCY",
    "firstName": "Brett",
    "lastName": "Hobbs",
    "title": "General Manager - Cape Town",
    "birthday": "2025-01-09"
  },
  {
    "company": "Joe Public",
    "type": "AGENCY",
    "firstName": "Wanita",
    "lastName": "Ismail",
    "title": "Senior Buyer",
    "birthday": "2025-01-09"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Delia",
    "lastName": "De Freitas",
    "title": "Senior Buyer",
    "birthday": "2026-01-09"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Tlhologelo",
    "lastName": "Magongwa",
    "title": "Campaign Manager",
    "birthday": "2026-01-09"
  },
  {
    "company": "UMWW",
    "type": "AGENCY",
    "firstName": "Ofentse",
    "lastName": "Ikaneng",
    "title": "Client Lead",
    "birthday": "2025-01-11"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Sandra",
    "lastName": "Kemp",
    "title": "Implementation Planner",
    "birthday": "2026-01-12"
  },
  {
    "company": "Coty Cosmetics",
    "type": "CLIENT",
    "firstName": "Candice",
    "lastName": "Gray",
    "title": "Brand Manager",
    "birthday": "2025-01-13"
  },
  {
    "company": "Fox Five Media",
    "type": "AGENCY",
    "firstName": "Meegan",
    "lastName": "Kieffer",
    "title": "Director of Marketing",
    "birthday": "2025-01-13"
  },
  {
    "company": "Joe Public",
    "type": "AGENCY",
    "firstName": "Avashini",
    "lastName": "Chetty",
    "title": "Social Media Manager",
    "birthday": "2025-01-16"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Shannon",
    "lastName": "Cannell",
    "title": "Media Buyer",
    "birthday": "2025-01-17"
  },
  {
    "company": "POLO Clothing",
    "type": "CLIENT",
    "firstName": "Zizi",
    "lastName": "(no surname given)",
    "title": "marketing",
    "birthday": "2025-01-17"
  },
  {
    "company": "Carat Jhb",
    "type": "AGENCY",
    "firstName": "Ilse",
    "lastName": "Hayes",
    "title": "Senior Media Implementation Planner",
    "birthday": "2025-01-18"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Charne",
    "lastName": "McMahon",
    "title": "Account Director",
    "birthday": "2025-01-19"
  },
  {
    "company": "Phd Jhb",
    "type": "AGENCY",
    "firstName": "Audrey",
    "lastName": "van Zyl",
    "title": "Planner",
    "birthday": "2025-01-20"
  },
  {
    "company": "Carat Jhb",
    "type": "AGENCY",
    "firstName": "Megan",
    "lastName": "Sayle",
    "title": "Head of Strategy",
    "birthday": "2025-01-20"
  },
  {
    "company": "UM",
    "type": "AGENCY",
    "firstName": "Tamia",
    "lastName": "Thompson",
    "title": "Media Buyer",
    "birthday": "2026-01-21"
  },
  {
    "company": "Unknown / No Company Listed",
    "type": "CLIENT",
    "firstName": "Shihaam",
    "lastName": "Abrahams",
    "title": null,
    "birthday": "2025-01-21"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Riezkah",
    "lastName": "Allan",
    "title": "Media Strategist",
    "birthday": "2025-01-22"
  },
  {
    "company": "Naked Insurance",
    "type": "CLIENT",
    "firstName": "Tshiamo",
    "lastName": "(no surname given)",
    "title": "Marketing Coordinator",
    "birthday": "2025-01-23"
  },
  {
    "company": "Unknown / No Company Listed",
    "type": "CLIENT",
    "firstName": "Andile",
    "lastName": "Qkweni",
    "title": null,
    "birthday": "2025-01-26"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Monique",
    "lastName": "Clark",
    "title": "BUD",
    "birthday": "2025-01-29"
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Monique",
    "lastName": "Clark",
    "title": "Management and Strategy",
    "birthday": "2025-01-29"
  },
  {
    "company": "Initiative Media",
    "type": "AGENCY",
    "firstName": "Johanna",
    "lastName": "Ngema",
    "title": "Lead Channel Buyer",
    "birthday": "2025-02-01"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Buhle",
    "lastName": "Matshaya",
    "title": "Media Buyer",
    "birthday": "2026-02-02"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Sandra",
    "lastName": "Cross",
    "title": "OOH Strategist",
    "birthday": "2026-02-02"
  },
  {
    "company": "Carat Jhb",
    "type": "AGENCY",
    "firstName": "Candice",
    "lastName": "Theron",
    "title": "Media Director",
    "birthday": "2025-02-03"
  },
  {
    "company": "OMD",
    "type": "AGENCY",
    "firstName": "Natalie",
    "lastName": "Swartz",
    "title": "Media Buyer",
    "birthday": "2025-02-03"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Makhosi",
    "lastName": "Mdakane",
    "title": "Integrated Planner",
    "birthday": "2026-02-04"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Sarika",
    "lastName": "Hoosen",
    "title": "Business Unit Director",
    "birthday": "2025-02-05"
  },
  {
    "company": "Hurley",
    "type": "CLIENT",
    "firstName": "Paul",
    "lastName": "(no surname given)",
    "title": "Brand Manager",
    "birthday": "2025-02-05"
  },
  {
    "company": "UMWW",
    "type": "AGENCY",
    "firstName": "Jos",
    "lastName": "De Beer",
    "title": "Client Lead",
    "birthday": "2025-02-06"
  },
  {
    "company": "Dotsure",
    "type": "CLIENT",
    "firstName": "Andrea",
    "lastName": "Plaatjies",
    "title": "Media Planner",
    "birthday": "2025-02-08"
  },
  {
    "company": "Penquin",
    "type": "CLIENT",
    "firstName": "Vanessa",
    "lastName": "Mthombeni-Khumalo",
    "title": "Planner",
    "birthday": "2025-02-08"
  },
  {
    "company": "UMWW",
    "type": "AGENCY",
    "firstName": "Mokgadi",
    "lastName": "Rapholo",
    "title": "Implementations Planner",
    "birthday": "2025-02-08"
  },
  {
    "company": "Universal Paints",
    "type": "CLIENT",
    "firstName": "Trudie",
    "lastName": "(no surname given)",
    "title": "Owner",
    "birthday": "2025-02-09"
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Sibusiso",
    "lastName": "Mbongo",
    "title": "Strategy Portfolio Lead",
    "birthday": "2026-02-09"
  },
  {
    "company": "UM",
    "type": "AGENCY",
    "firstName": "Michelle",
    "lastName": "Sekete",
    "title": "Digital Media Strategist",
    "birthday": "2026-02-10"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Caron",
    "lastName": "Solomon",
    "title": "General Assistant",
    "birthday": "2025-02-10"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Sthanda",
    "lastName": "Manciya",
    "title": "Client Portfoil Director",
    "birthday": "2026-02-10"
  },
  {
    "company": "Sunglass Hut",
    "type": "CLIENT",
    "firstName": "Earl",
    "lastName": "Kopeledi",
    "title": "Marketing Manager",
    "birthday": "2025-02-16"
  },
  {
    "company": "Meta Media - CPT",
    "type": "AGENCY",
    "firstName": "Tariq",
    "lastName": "Sampson",
    "title": "Campaign Manager",
    "birthday": "2025-02-16"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Noxolo",
    "lastName": "Jele",
    "title": "Senior Media Buyer",
    "birthday": "2026-02-16"
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Ayanda",
    "lastName": "Zulu",
    "title": "Hybrid Media Planner",
    "birthday": "2026-02-16"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Cindy",
    "lastName": "Mbatha",
    "title": "Receptionist",
    "birthday": "2026-02-22"
  },
  {
    "company": "Carat Jhb",
    "type": "AGENCY",
    "firstName": "Selina",
    "lastName": "Orgill",
    "title": "Media Planner",
    "birthday": "2025-02-24"
  },
  {
    "company": "Torque Media",
    "type": "AGENCY",
    "firstName": "Brigitte",
    "lastName": "(no surname given)",
    "title": "Key Accounts Manager",
    "birthday": "2025-02-25"
  },
  {
    "company": "OMD",
    "type": "AGENCY",
    "firstName": "Tamsyn",
    "lastName": "Ingle",
    "title": "Media Buyer",
    "birthday": "2025-02-25"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Rina",
    "lastName": "De Bruin",
    "title": "Media Buyer",
    "birthday": "2026-02-25"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Noxolo",
    "lastName": "Jele",
    "title": "Media Buyer",
    "birthday": "2025-02-26"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Sharon",
    "lastName": "Lloyd",
    "title": "Planner",
    "birthday": "2025-02-27"
  },
  {
    "company": "Indigo Brands (Pty) Ltd",
    "type": "CLIENT",
    "firstName": "Siyaam",
    "lastName": "Saferdien",
    "title": "Brand Manager",
    "birthday": "2025-02-27"
  },
  {
    "company": "Amplify",
    "type": "AGENCY",
    "firstName": "Michelle",
    "lastName": "Jacobs",
    "title": "Team Leader Planner Buyer",
    "birthday": "2025-02-28"
  },
  {
    "company": "Joe Public",
    "type": "AGENCY",
    "firstName": "Lineo",
    "lastName": "Motaung",
    "title": "Community Manager Intern",
    "birthday": "2025-02-28"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Herman",
    "lastName": "Degener",
    "title": "Business Unit Manager /Netbank Digital Media Strategist",
    "birthday": null
  },
  {
    "company": "Initiative Media",
    "type": "AGENCY",
    "firstName": "Jane",
    "lastName": "Arnoldi",
    "title": "Media Buyer",
    "birthday": "2025-03-01"
  },
  {
    "company": "OMG Jhb",
    "type": "AGENCY",
    "firstName": "Alicia",
    "lastName": "Marshman",
    "title": "BUD",
    "birthday": "2025-03-02"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Kevin",
    "lastName": "Ndinguri",
    "title": "MD",
    "birthday": "2025-03-02"
  },
  {
    "company": "Zenith",
    "type": "AGENCY",
    "firstName": "Tshepiso",
    "lastName": "Kgarebe",
    "title": "Digital Strategic Planner",
    "birthday": "2026-03-02"
  },
  {
    "company": "Mediology",
    "type": "AGENCY",
    "firstName": "Christo",
    "lastName": "Van Den Bergh",
    "title": "Head of OOO",
    "birthday": "2026-03-03"
  },
  {
    "company": "Meta Media - JHB",
    "type": "AGENCY",
    "firstName": "Kevin",
    "lastName": "Levy",
    "title": "Media Strategist",
    "birthday": "2025-03-04"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Nafisa",
    "lastName": "Salie",
    "title": "Media Planner",
    "birthday": "2025-03-05"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Greg",
    "lastName": "Wendzicha",
    "title": "Media Planner",
    "birthday": "2026-03-05"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Priya",
    "lastName": "Ravji",
    "title": "OOH Media Planner",
    "birthday": "2026-03-05"
  },
  {
    "company": "UMWW",
    "type": "AGENCY",
    "firstName": "Ofentse",
    "lastName": "Modisane",
    "title": "Account Lead",
    "birthday": "2025-03-05"
  },
  {
    "company": "Phd Jhb",
    "type": "AGENCY",
    "firstName": "Anne",
    "lastName": "Janse van Rensburg",
    "title": "Managing Director",
    "birthday": "2025-03-07"
  },
  {
    "company": "Joe Public",
    "type": "AGENCY",
    "firstName": "Tanya",
    "lastName": "Schreuder",
    "title": "CEO - Media Divison",
    "birthday": "2025-03-07"
  },
  {
    "company": "Amplify",
    "type": "AGENCY",
    "firstName": "Wilise",
    "lastName": "Laurent",
    "title": "Senior Media Buyer",
    "birthday": "2025-03-07"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Puseletso",
    "lastName": "Monaiwa",
    "title": "Business Unit Director",
    "birthday": "2025-03-07"
  },
  {
    "company": "Phd Cpt",
    "type": "AGENCY",
    "firstName": "Zeenat",
    "lastName": "Steenkamp",
    "title": "Account Manager",
    "birthday": "2025-03-09"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Lerato",
    "lastName": "Maimela",
    "title": "Media Planner",
    "birthday": "2025-03-09"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Kayleigh",
    "lastName": "Capuzzimati",
    "title": "Senior Strategist",
    "birthday": "2026-03-09"
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Amena",
    "lastName": "Patel",
    "title": "Network Co-Ordinator",
    "birthday": "2026-03-09"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Muhle",
    "lastName": "Hlabano",
    "title": "BUD",
    "birthday": "2025-03-11"
  },
  {
    "company": "UM",
    "type": "AGENCY",
    "firstName": "Khulekani",
    "lastName": "Zwane",
    "title": "Biddable Specialist",
    "birthday": "2026-03-12"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Lungile",
    "lastName": "Mbatha",
    "title": "OOH Planner",
    "birthday": "2026-03-12"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Lea",
    "lastName": "Patton",
    "title": "Media Planner",
    "birthday": "2025-03-13"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Melanie",
    "lastName": "Michaels",
    "title": "Media Buyer",
    "birthday": "2025-03-13"
  },
  {
    "company": "Carat Jhb",
    "type": "AGENCY",
    "firstName": "Ashleigh",
    "lastName": "Sayle",
    "title": "Account Executive",
    "birthday": "2025-03-16"
  },
  {
    "company": "Phd Jhb",
    "type": "AGENCY",
    "firstName": "Andrea",
    "lastName": "Bokelman",
    "title": "Planner",
    "birthday": "2025-03-15"
  },
  {
    "company": "UM",
    "type": "AGENCY",
    "firstName": "Terry",
    "lastName": "Matsa",
    "title": "Planner",
    "birthday": "2025-03-15"
  },
  {
    "company": "M&C Connect",
    "type": "AGENCY",
    "firstName": "Martin",
    "lastName": "MacGregor",
    "title": "Managing  Director",
    "birthday": "2025-03-17"
  },
  {
    "company": "Initiative Media",
    "type": "AGENCY",
    "firstName": "Ingrid",
    "lastName": "Crowder",
    "title": "Lead Strategist",
    "birthday": "2025-03-18"
  },
  {
    "company": "Dentsu",
    "type": "AGENCY",
    "firstName": "Kevin",
    "lastName": "Gibson",
    "title": "Account Director",
    "birthday": "2025-03-20"
  },
  {
    "company": "Phd Cpt",
    "type": "AGENCY",
    "firstName": "Lorainne",
    "lastName": "Oosthuizen",
    "title": "Snr Planner",
    "birthday": "2025-03-20"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Shannon",
    "lastName": "Xokezela",
    "title": "BUD",
    "birthday": "2025-03-21"
  },
  {
    "company": "Carat Jhb",
    "type": "AGENCY",
    "firstName": "Graham",
    "lastName": "Deneys",
    "title": "Chief Strategy Officer",
    "birthday": "2025-03-22"
  },
  {
    "company": "Fame Media",
    "type": "AGENCY",
    "firstName": "Amy",
    "lastName": "Liebbrandt",
    "title": "MD",
    "birthday": "2025-03-23"
  },
  {
    "company": "Ivie Media",
    "type": "AGENCY",
    "firstName": "Alison",
    "lastName": "Kinon",
    "title": "Operations Director",
    "birthday": "2025-03-23"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Tshepo",
    "lastName": "Moeketsi",
    "title": "CM360 Specialist",
    "birthday": "2026-03-23"
  },
  {
    "company": "Ivie Media",
    "type": "AGENCY",
    "firstName": "Keanan",
    "lastName": "Mosetic",
    "title": "Marketing Data Analyst",
    "birthday": "2025-03-25"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Emily",
    "lastName": "Mathonsi",
    "title": "Digital Media Planner",
    "birthday": "2026-03-25"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Tandile",
    "lastName": "Ndzululeka",
    "title": "Junior Communications Strategist",
    "birthday": "2026-03-26"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Dawn",
    "lastName": "Harwood",
    "title": "Implementation Buyer",
    "birthday": "2026-03-27"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Bronwyn",
    "lastName": "Joubert",
    "title": "BUD",
    "birthday": "2025-03-28"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Prevashin",
    "lastName": "Naicker",
    "title": "Media Account Executive",
    "birthday": "2025-03-29"
  },
  {
    "company": "UMWW",
    "type": "AGENCY",
    "firstName": "Prianka",
    "lastName": "Kanniappen",
    "title": "Media Planner",
    "birthday": "2025-03-29"
  },
  {
    "company": "OMD",
    "type": "AGENCY",
    "firstName": "Rachel",
    "lastName": "Storrie",
    "title": "Credit Controller",
    "birthday": "2025-03-29"
  },
  {
    "company": "Torque Media",
    "type": "AGENCY",
    "firstName": "Natasha",
    "lastName": "(no surname given)",
    "title": "Admin",
    "birthday": "2025-03-30"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Alex",
    "lastName": "Spagnoletti",
    "title": "Digital Media Strategist",
    "birthday": "2026-03-30"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Colin",
    "lastName": "Ramparsadh",
    "title": "Group Head:JD Group",
    "birthday": "2026-03-30"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Dimakatso",
    "lastName": "Motsie",
    "title": "Media Planner",
    "birthday": "2026-03-31"
  },
  {
    "company": "Phd Cpt",
    "type": "AGENCY",
    "firstName": "Anita",
    "lastName": "Sibozo",
    "title": "Planner",
    "birthday": "2025-04-01"
  },
  {
    "company": "UM",
    "type": "AGENCY",
    "firstName": "Jaquelyn",
    "lastName": "Knell",
    "title": "Senior Media Buyer",
    "birthday": "2025-04-02"
  },
  {
    "company": "Initiative Media",
    "type": "AGENCY",
    "firstName": "Nashita",
    "lastName": "Slamong",
    "title": "Channel Planner",
    "birthday": "2025-04-02"
  },
  {
    "company": "UMWW",
    "type": "AGENCY",
    "firstName": "Jaquelyn",
    "lastName": "Knell",
    "title": "Senior Media Buyer",
    "birthday": "2025-04-02"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Isla",
    "lastName": "Prentis",
    "title": "Intelligence Lead",
    "birthday": "2026-04-03"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Abedah",
    "lastName": "Hakim",
    "title": "Digital Media Planner",
    "birthday": "2026-04-05"
  },
  {
    "company": "Phd Cpt",
    "type": "AGENCY",
    "firstName": "Tracy",
    "lastName": "Faulmann",
    "title": "Strategic Lead",
    "birthday": "2025-04-06"
  },
  {
    "company": "Ivie Media",
    "type": "AGENCY",
    "firstName": "Irina",
    "lastName": "Vlad",
    "title": "CEO",
    "birthday": "2025-04-06"
  },
  {
    "company": "Carat Jhb",
    "type": "AGENCY",
    "firstName": "Marita",
    "lastName": "Palm",
    "title": "Client Portfolio Lead",
    "birthday": "2025-04-07"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Vanessa",
    "lastName": "Spiller",
    "title": "Buying Manager",
    "birthday": "2026-04-07"
  },
  {
    "company": "OMD",
    "type": "AGENCY",
    "firstName": "Jamie",
    "lastName": "Erasmus",
    "title": "Ad Ops Executive",
    "birthday": "2025-04-09"
  },
  {
    "company": "Carat Jhb",
    "type": "AGENCY",
    "firstName": "Bahia",
    "lastName": "Ahmed",
    "title": "Implementation Planner",
    "birthday": "2025-04-10"
  },
  {
    "company": "Meta Media - CPT",
    "type": "AGENCY",
    "firstName": "Lize",
    "lastName": "Cilliers",
    "title": "Digital Planner",
    "birthday": "2026-04-11"
  },
  {
    "company": "UM",
    "type": "AGENCY",
    "firstName": "Anje",
    "lastName": "Smit",
    "title": "Digital Strategist",
    "birthday": "2025-04-12"
  },
  {
    "company": "Meta Media - CPT",
    "type": "AGENCY",
    "firstName": "Jade",
    "lastName": "Bastiaan",
    "title": "Strategic Planner Hybrid",
    "birthday": "2025-04-13"
  },
  {
    "company": "Zenith",
    "type": "AGENCY",
    "firstName": "Carol",
    "lastName": "Mafokoane",
    "title": "Strategist Media Planner",
    "birthday": "2025-04-13"
  },
  {
    "company": "Unknown / No Company Listed",
    "type": "CLIENT",
    "firstName": "Shaun",
    "lastName": "Strydom",
    "title": null,
    "birthday": "2025-04-15"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Remofilwe",
    "lastName": "Moeketsi",
    "title": "Chief Technical Officer",
    "birthday": "2026-04-15"
  },
  {
    "company": "Planit Media",
    "type": "AGENCY",
    "firstName": "Greer",
    "lastName": "Hogarth",
    "title": "Planner",
    "birthday": "2025-04-20"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Dashni",
    "lastName": "Vilakazi",
    "title": "Managing Director",
    "birthday": "2026-04-21"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Serati",
    "lastName": "Ntsuele",
    "title": "Media Buyer",
    "birthday": "2026-04-21"
  },
  {
    "company": "Independent",
    "type": "CLIENT",
    "firstName": "Livia",
    "lastName": "Brown",
    "title": null,
    "birthday": "2025-04-22"
  },
  {
    "company": "Joe Public",
    "type": "AGENCY",
    "firstName": "Rene",
    "lastName": "Fowler",
    "title": "Head of Ad Operations",
    "birthday": "2025-04-24"
  },
  {
    "company": "Phd Cpt",
    "type": "AGENCY",
    "firstName": "Candice",
    "lastName": "Snyman",
    "title": null,
    "birthday": "2026-04-24"
  },
  {
    "company": "Beauty Fires",
    "type": "CLIENT",
    "firstName": "Jamie",
    "lastName": "(no surname given)",
    "title": "Marketing",
    "birthday": "2025-04-25"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Kemantha",
    "lastName": "Moosajee",
    "title": "Account Director",
    "birthday": "2025-04-26"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Ntsako",
    "lastName": "Matsheke",
    "title": "Media Accounts Clerk",
    "birthday": "2025-04-26"
  },
  {
    "company": "Sunglass Hut",
    "type": "CLIENT",
    "firstName": "Sade",
    "lastName": "Anter",
    "title": "Brand Manager",
    "birthday": "2025-04-28"
  },
  {
    "company": "Dentsu",
    "type": "AGENCY",
    "firstName": "Astrid",
    "lastName": "Staegemann",
    "title": "Media Director",
    "birthday": "2025-04-29"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Ntsako",
    "lastName": "Matsheke",
    "title": "Media Accounts Clerk",
    "birthday": "2025-04-29"
  },
  {
    "company": "Western Cape Blood Services",
    "type": "CLIENT",
    "firstName": "Marike",
    "lastName": "Carli",
    "title": "Marketing Manager",
    "birthday": "2025-04-29"
  },
  {
    "company": "Initiative Media",
    "type": "AGENCY",
    "firstName": "*",
    "lastName": "Michelle Wheeler",
    "title": "MD",
    "birthday": "2025-05-01"
  },
  {
    "company": "Phd Jhb",
    "type": "AGENCY",
    "firstName": "Helen",
    "lastName": "Ravenscroft",
    "title": "Planner",
    "birthday": "2025-05-01"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Kgomotso",
    "lastName": "Ramotshela",
    "title": "Media Buyer",
    "birthday": "2026-05-01"
  },
  {
    "company": "Kintaro",
    "type": "AGENCY",
    "firstName": "Quinton",
    "lastName": "Jones",
    "title": "Managing Director",
    "birthday": "2025-05-02"
  },
  {
    "company": "Fame Media",
    "type": "AGENCY",
    "firstName": "Jacques",
    "lastName": "Carstens",
    "title": "Media Planner",
    "birthday": "2025-05-03"
  },
  {
    "company": "Prestige Cosmetics",
    "type": "CLIENT",
    "firstName": "Lorelle",
    "lastName": "Meyer",
    "title": "Brand Manager",
    "birthday": "2025-05-03"
  },
  {
    "company": "Dentsu",
    "type": "AGENCY",
    "firstName": "Lynne",
    "lastName": "Lawrence",
    "title": "Finance",
    "birthday": "2025-05-03"
  },
  {
    "company": "The Sharpest Pencil",
    "type": "AGENCY",
    "firstName": "Tatum",
    "lastName": "(no surname given)",
    "title": "Client Service Director",
    "birthday": "2025-05-04"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Lynette",
    "lastName": "Naidoo",
    "title": "Managing Director",
    "birthday": "2026-05-04"
  },
  {
    "company": "UM",
    "type": "AGENCY",
    "firstName": "Zandile",
    "lastName": "Malindi",
    "title": "Media Buyer",
    "birthday": "2025-05-05"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Tebogo",
    "lastName": "Mogano",
    "title": "ATL Planner/OOH Specialist",
    "birthday": "2026-05-05"
  },
  {
    "company": "VOYS Telecoms",
    "type": "CLIENT",
    "firstName": "Guilaumme",
    "lastName": "(no surname given)",
    "title": "Marketing",
    "birthday": "2025-05-06"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Anitta",
    "lastName": "Gubayo",
    "title": "Mid Media Buyer",
    "birthday": "2026-05-08"
  },
  {
    "company": "Six Sense Marketing",
    "type": "AGENCY",
    "firstName": "Charlotte",
    "lastName": "Swanepoel",
    "title": "Marketing Manager",
    "birthday": "2025-05-09"
  },
  {
    "company": "Planit Media",
    "type": "AGENCY",
    "firstName": "Erica",
    "lastName": "Gunning",
    "title": "CEO",
    "birthday": "2025-05-11"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Chris",
    "lastName": "Botha",
    "title": "Group Managing Director",
    "birthday": "2026-05-12"
  },
  {
    "company": "M&C Connect",
    "type": "AGENCY",
    "firstName": "Sonia",
    "lastName": "Mather",
    "title": "Senior  Media Planner",
    "birthday": "2025-05-13"
  },
  {
    "company": "Amplify",
    "type": "AGENCY",
    "firstName": "Jianni",
    "lastName": "Du Plessis",
    "title": "Senior Media Buyer",
    "birthday": "2025-05-14"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Yolandi",
    "lastName": "van Zyl",
    "title": "Operations",
    "birthday": "2025-05-14"
  },
  {
    "company": "UMWW",
    "type": "AGENCY",
    "firstName": "Jennifer",
    "lastName": "Hudson",
    "title": "Business Lead",
    "birthday": "2025-05-15"
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Thuso",
    "lastName": "Gcabashe",
    "title": "ATL Planner",
    "birthday": "2026-05-15"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Marina",
    "lastName": "Da Cruz",
    "title": "Media Planner",
    "birthday": "2025-05-16"
  },
  {
    "company": "Meta Media - JHB",
    "type": "AGENCY",
    "firstName": "Sinenhlanhla",
    "lastName": "Jalibane",
    "title": "Digital Media Strategist",
    "birthday": "2025-05-16"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Tebogo",
    "lastName": "Raikane",
    "title": "OOH Specialist",
    "birthday": "2025-05-18"
  },
  {
    "company": "Media Mix 360",
    "type": "AGENCY",
    "firstName": "Xhanti",
    "lastName": "Lungu",
    "title": "Planner",
    "birthday": "2025-05-19"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Rirhandzu",
    "lastName": "Shingwenyana",
    "title": "Junior Account Manager",
    "birthday": "2025-05-20"
  },
  {
    "company": "Verto.com",
    "type": "CLIENT",
    "firstName": "Torsten",
    "lastName": "(no surname given)",
    "title": "Marketing Manager",
    "birthday": "2025-05-21"
  },
  {
    "company": "Unknown / No Company Listed",
    "type": "CLIENT",
    "firstName": "Emma",
    "lastName": "Haines",
    "title": null,
    "birthday": "2025-05-22"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Kamogelo",
    "lastName": "Rakosa",
    "title": "Account Executive",
    "birthday": "2025-05-22"
  },
  {
    "company": "Mandelabay Theatre",
    "type": "CLIENT",
    "firstName": "Kent",
    "lastName": "Cairncross",
    "title": "Acting Marketing Manager",
    "birthday": "2025-05-22"
  },
  {
    "company": "Yoco",
    "type": "CLIENT",
    "firstName": "Natasha",
    "lastName": "Fourie",
    "title": null,
    "birthday": "2025-05-22"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Kamogelo",
    "lastName": "Rakosa",
    "title": "Account Executive",
    "birthday": "2025-05-22"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Virginia",
    "lastName": "Maake",
    "title": "Media Buyer",
    "birthday": "2026-05-24"
  },
  {
    "company": "Initiative Media",
    "type": "AGENCY",
    "firstName": "Casey",
    "lastName": "Wasserman",
    "title": "Digital Intern",
    "birthday": "2026-05-24"
  },
  {
    "company": "Phd Cpt",
    "type": "AGENCY",
    "firstName": "Sima",
    "lastName": "Mooi",
    "title": "Receptionist",
    "birthday": "2025-05-25"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Lwazi",
    "lastName": "Mhlongo",
    "title": "Strategist (Nedbank)",
    "birthday": "2025-05-26"
  },
  {
    "company": "UM",
    "type": "AGENCY",
    "firstName": "Zoleka",
    "lastName": "Botwana",
    "title": "Biddable Specialist",
    "birthday": "2025-05-28"
  },
  {
    "company": "Park Advertising",
    "type": "AGENCY",
    "firstName": "Shamiel",
    "lastName": "Isaacs",
    "title": "Media Buyer",
    "birthday": "2025-05-30"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Zamaphithi",
    "lastName": "Maphumulo",
    "title": "Senior Media Planner",
    "birthday": "2025-05-31"
  },
  {
    "company": "Superdry Clothing",
    "type": "CLIENT",
    "firstName": "Levonia",
    "lastName": "(no surname given)",
    "title": "Brand Manager",
    "birthday": "2025-06-02"
  },
  {
    "company": "PMAC",
    "type": "AGENCY",
    "firstName": "Marc",
    "lastName": "Moore",
    "title": "MD",
    "birthday": "2025-06-02"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Bryce",
    "lastName": "Betha",
    "title": "Senior Account Manager",
    "birthday": "2025-06-03"
  },
  {
    "company": "Joe Public",
    "type": "AGENCY",
    "firstName": "Sian",
    "lastName": "Propheta",
    "title": "Digital Meida Specialitst",
    "birthday": "2025-06-03"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Reneilwe",
    "lastName": "Sekgobela",
    "title": "Digital Planner/ Account Executive",
    "birthday": "2026-06-04"
  },
  {
    "company": "UMWW",
    "type": "AGENCY",
    "firstName": "Zandile",
    "lastName": "Malindi",
    "title": "Media Buyer",
    "birthday": "2025-06-05"
  },
  {
    "company": "M&C Connect",
    "type": "AGENCY",
    "firstName": "Sumitra",
    "lastName": "Naidoo",
    "title": "Planner",
    "birthday": "2025-06-06"
  },
  {
    "company": "Amplify",
    "type": "AGENCY",
    "firstName": "Toegieda",
    "lastName": "Nordien",
    "title": "OOH Media Buyer",
    "birthday": "2025-06-06"
  },
  {
    "company": "Joe Public",
    "type": "AGENCY",
    "firstName": "Nicolas",
    "lastName": "Whipp",
    "title": "Performance Specialist",
    "birthday": "2025-06-08"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Jedd",
    "lastName": "Cokayne",
    "title": "Group Head: Famous Brands",
    "birthday": "2026-06-08"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Nadia",
    "lastName": "Weimers",
    "title": "Business Unit Director",
    "birthday": "2025-06-09"
  },
  {
    "company": "Phd Cpt",
    "type": "AGENCY",
    "firstName": "Laaiqah",
    "lastName": "Kippie",
    "title": "Campign Administrator",
    "birthday": "2025-06-10"
  },
  {
    "company": "Phd Jhb",
    "type": "AGENCY",
    "firstName": "Nicky",
    "lastName": "Isaacs",
    "title": "Digital Planner",
    "birthday": "2025-06-10"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Marli",
    "lastName": "Steyn",
    "title": "Publicis Leon MEA Wellness Lead",
    "birthday": "2026-06-10"
  },
  {
    "company": "Vizeum",
    "type": "AGENCY",
    "firstName": "Shannon",
    "lastName": "Williams",
    "title": "Media Planner",
    "birthday": "2025-06-11"
  },
  {
    "company": "Joe Public",
    "type": "AGENCY",
    "firstName": "Tholoana",
    "lastName": "Ndlovu",
    "title": "Senior Social Meida Manager",
    "birthday": "2025-06-12"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Koena",
    "lastName": "Teffo",
    "title": "Planner",
    "birthday": "2025-06-12"
  },
  {
    "company": "Meta Media - JHB",
    "type": "AGENCY",
    "firstName": "Mpho",
    "lastName": "Maboatle",
    "title": "Junior Media Planner",
    "birthday": "2025-06-12"
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Marcia",
    "lastName": "Mudzwiti",
    "title": "Strategic digital Lead",
    "birthday": "2026-06-12"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Tahnee",
    "lastName": "Cokayne",
    "title": "OOH Planner",
    "birthday": "2026-06-13"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Masholotlo",
    "lastName": "Sibeko",
    "title": "Head of Digital",
    "birthday": "2025-06-15"
  },
  {
    "company": "Media Mix 360",
    "type": "AGENCY",
    "firstName": "Neo",
    "lastName": "Qongqo",
    "title": "Planner",
    "birthday": "2025-06-15"
  },
  {
    "company": "OMD",
    "type": "AGENCY",
    "firstName": "June",
    "lastName": "Lippert",
    "title": "Strategist",
    "birthday": "2025-06-17"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Sue",
    "lastName": "Stride",
    "title": "Senior Financial Controller",
    "birthday": "2026-06-17"
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Tess",
    "lastName": "Wainwright",
    "title": "Digital Africa Lead",
    "birthday": "2026-06-17"
  },
  {
    "company": "Zenith",
    "type": "AGENCY",
    "firstName": "Zizipho",
    "lastName": "Dilimeni",
    "title": "Hybrid Planner",
    "birthday": "2026-06-18"
  },
  {
    "company": "Fame Media",
    "type": "AGENCY",
    "firstName": "Georgina",
    "lastName": "Mhlahlo",
    "title": "Account Planner",
    "birthday": "2025-06-20"
  },
  {
    "company": "Pick n Pay",
    "type": "CLIENT",
    "firstName": "Judy",
    "lastName": "Lilkant",
    "title": "Media Manager",
    "birthday": "2025-06-20"
  },
  {
    "company": "MediaMerge",
    "type": "AGENCY",
    "firstName": "Lana",
    "lastName": "Rossouw",
    "title": "Account Manager",
    "birthday": "2025-06-20"
  },
  {
    "company": "M&C Connect",
    "type": "AGENCY",
    "firstName": "Rita",
    "lastName": "Nel",
    "title": "Chief Client Officer",
    "birthday": "2025-06-20"
  },
  {
    "company": "e.tv",
    "type": "CLIENT",
    "firstName": "Petunia",
    "lastName": "Matseba",
    "title": "Media Manager",
    "birthday": "2025-06-21"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Maggie",
    "lastName": "Pronto",
    "title": "Group Head:Nandos & Loreal",
    "birthday": "2026-06-21"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Sulize",
    "lastName": "Janse Van Vuuren",
    "title": "Implementation Planner",
    "birthday": "2026-06-21"
  },
  {
    "company": "Phd Cpt",
    "type": "AGENCY",
    "firstName": "Bonnie",
    "lastName": "Du Plessis",
    "title": "Planner",
    "birthday": "2025-06-22"
  },
  {
    "company": "Initiative Media",
    "type": "AGENCY",
    "firstName": "Collin",
    "lastName": "Khumalo",
    "title": "Media Buyer",
    "birthday": "2025-06-22"
  },
  {
    "company": "Phd Jhb",
    "type": "AGENCY",
    "firstName": "Dion",
    "lastName": "Pieterse",
    "title": "Head of Retail",
    "birthday": "2025-06-23"
  },
  {
    "company": "Phd Jhb",
    "type": "AGENCY",
    "firstName": "Cindy",
    "lastName": "Morris",
    "title": "Strategic lead",
    "birthday": "2025-06-24"
  },
  {
    "company": "Carat Jhb",
    "type": "AGENCY",
    "firstName": "Ingrid",
    "lastName": "Morgan Wilson",
    "title": "Account Director (Heineken)",
    "birthday": "2026-06-24"
  },
  {
    "company": "UMWW",
    "type": "AGENCY",
    "firstName": "Mojalefa",
    "lastName": "Mothudi",
    "title": "Digital Strategist",
    "birthday": "2025-06-25"
  },
  {
    "company": "OMG Jhb",
    "type": "AGENCY",
    "firstName": "Litha",
    "lastName": "Vimba",
    "title": "MD",
    "birthday": "2025-06-27"
  },
  {
    "company": "Media Mix 360",
    "type": "AGENCY",
    "firstName": "Tshegofatso",
    "lastName": "Ntlheng",
    "title": "Planner",
    "birthday": "2025-06-28"
  },
  {
    "company": "Meta Media - CPT",
    "type": "AGENCY",
    "firstName": "Talent",
    "lastName": "Rupapa",
    "title": "Digital Media Planner",
    "birthday": "2025-06-28"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Kim",
    "lastName": "Petersen (Cape Town)",
    "title": "Senior Buyer",
    "birthday": "2025-06-29"
  },
  {
    "company": "UMWW",
    "type": "AGENCY",
    "firstName": "Theodorah",
    "lastName": "Manjo",
    "title": "Account Lead",
    "birthday": "2025-06-29"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Letago",
    "lastName": "Matjila",
    "title": "Planner",
    "birthday": "2025-07-01"
  },
  {
    "company": "Planit Media",
    "type": "AGENCY",
    "firstName": "Stephanie",
    "lastName": "Sullivan",
    "title": "Strategist",
    "birthday": "2025-07-03"
  },
  {
    "company": "Meta Media - JHB",
    "type": "AGENCY",
    "firstName": "Martie",
    "lastName": "de Bruyn",
    "title": "Media Buyer",
    "birthday": "2025-07-04"
  },
  {
    "company": "UMWW",
    "type": "AGENCY",
    "firstName": "Shireen",
    "lastName": "Warner",
    "title": "Client Lead",
    "birthday": "2025-07-04"
  },
  {
    "company": "UM",
    "type": "AGENCY",
    "firstName": "Malerie",
    "lastName": "Booysen",
    "title": "Client Lead",
    "birthday": "2026-07-06"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Faith",
    "lastName": "Mohohoma",
    "title": "Reporting Manager",
    "birthday": "2026-07-06"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Avukonke",
    "lastName": "Koto",
    "title": "Media Planner",
    "birthday": "2025-07-07"
  },
  {
    "company": "Pick n Pay",
    "type": "CLIENT",
    "firstName": "Geraldine",
    "lastName": "Van Zyl",
    "title": "Media Planner",
    "birthday": "2025-07-09"
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Gina",
    "lastName": "Zuma",
    "title": "Digital Planner",
    "birthday": "2026-07-09"
  },
  {
    "company": "iProspect",
    "type": "AGENCY",
    "firstName": "Hazel",
    "lastName": "Maluleke",
    "title": "Hybrid Planner",
    "birthday": "2025-07-10"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Dikeledi",
    "lastName": "Maphoroma",
    "title": "Account Manager and Planner",
    "birthday": "2025-07-11"
  },
  {
    "company": "Meta Media - JHB",
    "type": "AGENCY",
    "firstName": "Motshedise",
    "lastName": "Ntsie",
    "title": "Senior Media Planner",
    "birthday": "2025-07-15"
  },
  {
    "company": "OMG Jhb",
    "type": "AGENCY",
    "firstName": "Zorobabel",
    "lastName": "Hlumbane",
    "title": "Planner",
    "birthday": "2025-07-16"
  },
  {
    "company": "UM",
    "type": "AGENCY",
    "firstName": "Francina",
    "lastName": "Masoga",
    "title": "Digital Buyer",
    "birthday": "2026-07-16"
  },
  {
    "company": "Meta Media - JHB",
    "type": "AGENCY",
    "firstName": "Nkateko",
    "lastName": "Mtshina (Nestle; Hollard)",
    "title": "Client Lead",
    "birthday": "2025-07-18"
  },
  {
    "company": "Mediamix 360 CPT",
    "type": "AGENCY",
    "firstName": "Fahiema",
    "lastName": "Ryklieff",
    "title": null,
    "birthday": "2025-07-18"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Nkateko",
    "lastName": "Mtshina",
    "title": "Business Unit Manager",
    "birthday": "2025-07-18"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Nonelela",
    "lastName": "Duba",
    "title": "Media Buyer",
    "birthday": "2025-07-18"
  },
  {
    "company": "UMWW",
    "type": "AGENCY",
    "firstName": "Khayelihle",
    "lastName": "Dlamini",
    "title": "Media Intern",
    "birthday": "2025-07-19"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Julian",
    "lastName": "Mtetwa",
    "title": "Digital Strategist",
    "birthday": "2025-07-19"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Pieter",
    "lastName": "Raath",
    "title": "Chief Financial Officer",
    "birthday": "2026-07-20"
  },
  {
    "company": "Adidas",
    "type": "CLIENT",
    "firstName": "Lisa",
    "lastName": "Ziechenhart",
    "title": "Marketing",
    "birthday": "2025-07-21"
  },
  {
    "company": "Zenith",
    "type": "AGENCY",
    "firstName": "Lebogang",
    "lastName": "Tema",
    "title": "Media Planner",
    "birthday": "2025-07-21"
  },
  {
    "company": "Meta Media - JHB",
    "type": "AGENCY",
    "firstName": "Lydia",
    "lastName": "Masiye",
    "title": "Personal Assistant to GMD & Office Manager",
    "birthday": "2025-07-22"
  },
  {
    "company": "TK Analytics",
    "type": "CLIENT",
    "firstName": "Tracy",
    "lastName": "Kirkman",
    "title": "CEO",
    "birthday": "2025-07-22"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Oko",
    "lastName": "Dyonase",
    "title": "Junior Media Planner",
    "birthday": "2025-07-22"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Kirsten",
    "lastName": "Dugmore",
    "title": "Strategist",
    "birthday": "2025-07-23"
  },
  {
    "company": "Posterscope",
    "type": "AGENCY",
    "firstName": "Mando",
    "lastName": "Mokone",
    "title": null,
    "birthday": "2025-07-25"
  },
  {
    "company": "Carat Jhb",
    "type": "AGENCY",
    "firstName": "Johane",
    "lastName": "Carstens",
    "title": "Account Manager",
    "birthday": "2025-07-27"
  },
  {
    "company": "Zenith",
    "type": "AGENCY",
    "firstName": "Ziyanda",
    "lastName": "Xashimba",
    "title": "Hybrid Media Strategist",
    "birthday": "2026-07-28"
  },
  {
    "company": "Meta Media - CPT",
    "type": "AGENCY",
    "firstName": "Ligia",
    "lastName": "Jaquest",
    "title": "Media Buyer",
    "birthday": "2026-07-29"
  },
  {
    "company": "Pick n Pay",
    "type": "CLIENT",
    "firstName": "Carlyn",
    "lastName": "Josephs",
    "title": "Media Buyer",
    "birthday": "2025-07-30"
  },
  {
    "company": "Carat Jhb",
    "type": "AGENCY",
    "firstName": "Zamile",
    "lastName": "J-Tee",
    "title": "Account Director",
    "birthday": "2025-07-30"
  },
  {
    "company": "OISHI",
    "type": "CLIENT",
    "firstName": "Stefano",
    "lastName": "Di Trappini",
    "title": "OWNER",
    "birthday": "2025-07-31"
  },
  {
    "company": "M Carr Media",
    "type": "AGENCY",
    "firstName": "Margie",
    "lastName": "Carr",
    "title": "Independent",
    "birthday": "2025-08-01"
  },
  {
    "company": "Sunbet",
    "type": "CLIENT",
    "firstName": "Gary",
    "lastName": "Weinst",
    "title": "Marketing",
    "birthday": "2025-08-02"
  },
  {
    "company": "Bloudruk Media",
    "type": "AGENCY",
    "firstName": "Jullian",
    "lastName": "(no surname given)",
    "title": "Key Accounts",
    "birthday": "2025-08-02"
  },
  {
    "company": "Phd Cpt",
    "type": "AGENCY",
    "firstName": "Inge",
    "lastName": "Hansen",
    "title": "Digital Director",
    "birthday": "2025-08-03"
  },
  {
    "company": "Dentsu Cpt",
    "type": "AGENCY",
    "firstName": "Musa",
    "lastName": "Mashaba",
    "title": null,
    "birthday": "2025-08-03"
  },
  {
    "company": "Magnate Media",
    "type": "AGENCY",
    "firstName": "Lauren",
    "lastName": "Hunt",
    "title": "Managing Director",
    "birthday": "2025-08-04"
  },
  {
    "company": "Joe Public",
    "type": "AGENCY",
    "firstName": "Boitumelo",
    "lastName": "Molebatsi",
    "title": "Media Intern",
    "birthday": "2025-08-04"
  },
  {
    "company": "Initiative Media",
    "type": "AGENCY",
    "firstName": "Carmelita",
    "lastName": "Allende",
    "title": "Lead Channel Buyer",
    "birthday": "2025-08-05"
  },
  {
    "company": "Phd Jhb",
    "type": "AGENCY",
    "firstName": "Howard",
    "lastName": "West",
    "title": "Group Data Manager",
    "birthday": "2025-08-05"
  },
  {
    "company": "Kintaro",
    "type": "AGENCY",
    "firstName": "Antoinette",
    "lastName": "Labuschagne",
    "title": "Strategist",
    "birthday": "2025-08-06"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Megan",
    "lastName": "Walker",
    "title": "Senior Media Strategist",
    "birthday": "2025-08-07"
  },
  {
    "company": "OMD",
    "type": "AGENCY",
    "firstName": "Nadia",
    "lastName": "Adams",
    "title": "Media Buyer",
    "birthday": "2025-08-08"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Lerato",
    "lastName": "Telane",
    "title": "OOH Specialist",
    "birthday": "2025-08-08"
  },
  {
    "company": "Naked Insurance",
    "type": "CLIENT",
    "firstName": "Liezel",
    "lastName": "(no surname given)",
    "title": "Marketing Manager",
    "birthday": "2025-08-10"
  },
  {
    "company": "Dotline",
    "type": "CLIENT",
    "firstName": "Ayanda",
    "lastName": "Phiri",
    "title": "Director",
    "birthday": "2025-08-10"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Sadie",
    "lastName": "Munsami",
    "title": "Junior Buyer",
    "birthday": "2025-08-11"
  },
  {
    "company": "Meta Media - JHB",
    "type": "AGENCY",
    "firstName": "Claire",
    "lastName": "Herman",
    "title": "Media Director",
    "birthday": "2025-08-12"
  },
  {
    "company": "Meta Media - JHB",
    "type": "AGENCY",
    "firstName": "Rebecca",
    "lastName": "Malibe",
    "title": "Media Buyer",
    "birthday": "2025-08-12"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Patrick",
    "lastName": "Mabusela",
    "title": "Senior Administrator",
    "birthday": "2026-08-12"
  },
  {
    "company": "Kintaro",
    "type": "AGENCY",
    "firstName": "Samantha",
    "lastName": "Joshua",
    "title": "NA",
    "birthday": "2025-08-14"
  },
  {
    "company": "Phd Jhb",
    "type": "AGENCY",
    "firstName": "Charl",
    "lastName": "Redelinghuys",
    "title": "Strategic Lead",
    "birthday": "2025-08-15"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Gareth",
    "lastName": "Grant",
    "title": "Media Operations Director",
    "birthday": "2026-08-15"
  },
  {
    "company": "Phd Jhb",
    "type": "AGENCY",
    "firstName": "Donna",
    "lastName": "Jacobs",
    "title": "Strategic lead",
    "birthday": "2025-08-17"
  },
  {
    "company": "OMD",
    "type": "AGENCY",
    "firstName": "Shannon",
    "lastName": "Van Rheede",
    "title": "Media Planner",
    "birthday": "2025-08-18"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Ronald",
    "lastName": "Ndukwani",
    "title": "Receptionist",
    "birthday": "2026-08-18"
  },
  {
    "company": "Initiative Media",
    "type": "AGENCY",
    "firstName": "Allison",
    "lastName": "Thompson",
    "title": "Implementation Manager",
    "birthday": "2025-08-19"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Radlyn",
    "lastName": "Naidoo",
    "title": "Media Operations Administrator",
    "birthday": "2026-08-19"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Michael(Mike)",
    "lastName": "Jones",
    "title": "Management and Strategy",
    "birthday": "2026-08-22"
  },
  {
    "company": "Prestige Cosmetics",
    "type": "CLIENT",
    "firstName": "Nicole",
    "lastName": "Wright",
    "title": "Brand Manager",
    "birthday": "2025-08-24"
  },
  {
    "company": "World Sports Betting",
    "type": "CLIENT",
    "firstName": "Ryno",
    "lastName": "(no surname given)",
    "title": "Marketing",
    "birthday": "2025-08-25"
  },
  {
    "company": "Pick n Pay",
    "type": "CLIENT",
    "firstName": "Tania",
    "lastName": "Saayman",
    "title": "Media Buyer",
    "birthday": "2025-08-25"
  },
  {
    "company": "Carat Jhb",
    "type": "AGENCY",
    "firstName": "Hemlata",
    "lastName": "Naidoo",
    "title": "Account Director",
    "birthday": "2025-08-26"
  },
  {
    "company": "Joe Public",
    "type": "AGENCY",
    "firstName": "Kelly",
    "lastName": "Moses",
    "title": "PR Account Manager",
    "birthday": "2025-08-26"
  },
  {
    "company": "Topex",
    "type": "CLIENT",
    "firstName": "Alan",
    "lastName": "Bursnal",
    "title": "Director",
    "birthday": "2025-08-27"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Simlindile",
    "lastName": "Khuzwayo",
    "title": "Junior Media Buyer",
    "birthday": "2026-08-27"
  },
  {
    "company": "SmartOutAds",
    "type": "AGENCY",
    "firstName": "Celeste\u2019",
    "lastName": "van Jaarsveld",
    "title": "Director",
    "birthday": "2025-08-29"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Mark",
    "lastName": "Duffield",
    "title": "Reporting Specialist",
    "birthday": "2026-08-29"
  },
  {
    "company": "Six Sense Marketing",
    "type": "AGENCY",
    "firstName": "Marche",
    "lastName": "Lawrence",
    "title": "Marketing Co-Ordinator",
    "birthday": "2025-08-31"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Angela",
    "lastName": "Childs",
    "title": "Haelon MEA Strategy Lead/OHC Category Lead",
    "birthday": "2026-09-01"
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Laurie",
    "lastName": "Herron",
    "title": "Hybrid Planner",
    "birthday": "2026-09-01"
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Nomonde",
    "lastName": "Dubase",
    "title": "ATL Planner",
    "birthday": "2026-09-02"
  },
  {
    "company": "Carat Cpt",
    "type": "AGENCY",
    "firstName": "Cara",
    "lastName": "Groener",
    "title": "Account Director",
    "birthday": "2025-09-03"
  },
  {
    "company": "UM",
    "type": "AGENCY",
    "firstName": "Deri-anne",
    "lastName": "Schniewind",
    "title": "Senior Planner",
    "birthday": "2025-09-04"
  },
  {
    "company": "Pineapple Insurance",
    "type": "CLIENT",
    "firstName": "Eunice",
    "lastName": "Mcgill",
    "title": "Senior Coordinator",
    "birthday": "2025-09-04"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Vanessa",
    "lastName": "McKay",
    "title": "Media Planner",
    "birthday": "2026-09-04"
  },
  {
    "company": "Initiative Media",
    "type": "AGENCY",
    "firstName": "Kareema",
    "lastName": "Jamie",
    "title": "Managing Partner",
    "birthday": "2025-09-06"
  },
  {
    "company": "UM",
    "type": "AGENCY",
    "firstName": "Lelo",
    "lastName": "Theletsane",
    "title": "Client Lead",
    "birthday": "2025-09-06"
  },
  {
    "company": "Amplify",
    "type": "AGENCY",
    "firstName": "Melissa",
    "lastName": "Kleinsmith",
    "title": "Media Buyer",
    "birthday": "2025-09-06"
  },
  {
    "company": "Joe Public",
    "type": "AGENCY",
    "firstName": "Jodi",
    "lastName": "Calvert",
    "title": "Channel Strategy Director",
    "birthday": "2025-09-07"
  },
  {
    "company": "M&C Connect",
    "type": "AGENCY",
    "firstName": "Keri",
    "lastName": "Young",
    "title": "BUD",
    "birthday": "2025-09-08"
  },
  {
    "company": "Joe Public",
    "type": "AGENCY",
    "firstName": "Portia",
    "lastName": "Sylvester",
    "title": "Business Unit Head",
    "birthday": "2025-09-08"
  },
  {
    "company": "Pick n Pay",
    "type": "CLIENT",
    "firstName": "Unathi",
    "lastName": "Nzweni",
    "title": "Implementation Planner",
    "birthday": "2025-09-09"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Petronella",
    "lastName": "Mphahlele",
    "title": "Account Manager",
    "birthday": "2025-09-09"
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Moya",
    "lastName": "Van der Merwe",
    "title": "BUD",
    "birthday": "2026-09-09"
  },
  {
    "company": "TMS",
    "type": "AGENCY",
    "firstName": "Sinazo",
    "lastName": "Jiyaya",
    "title": "Media Buyer",
    "birthday": "2025-09-10"
  },
  {
    "company": "Joe Public",
    "type": "AGENCY",
    "firstName": "Amanda",
    "lastName": "Pearce",
    "title": "SEO",
    "birthday": "2025-09-11"
  },
  {
    "company": "Zenith",
    "type": "AGENCY",
    "firstName": "Cleopatra",
    "lastName": "Shava",
    "title": "Group Account Director",
    "birthday": "2026-09-12"
  },
  {
    "company": "DROPPA",
    "type": "CLIENT",
    "firstName": "Zethu",
    "lastName": "(no surname given)",
    "title": "Marketing",
    "birthday": "2025-09-14"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Lebo",
    "lastName": "Rapolai",
    "title": "Implementation Planner/Buyer",
    "birthday": "2026-09-14"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Ashish",
    "lastName": "Williams",
    "title": "Senior Vice President",
    "birthday": "2026-09-15"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Carel",
    "lastName": "Scheepers",
    "title": "Head of Diversified Services",
    "birthday": "2025-09-16"
  },
  {
    "company": "Meta Media - CPT",
    "type": "AGENCY",
    "firstName": "Leila",
    "lastName": "Byrne",
    "title": "Digital Media Lead",
    "birthday": "2025-09-16"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Nombulelo",
    "lastName": "Nogwanya",
    "title": "Media Buyer",
    "birthday": "2025-09-17"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Shingi",
    "lastName": "Rupare",
    "title": "Insights Strategist",
    "birthday": "2026-09-17"
  },
  {
    "company": "Phd Cpt",
    "type": "AGENCY",
    "firstName": "Anne",
    "lastName": "Dearnaley",
    "title": "CEO",
    "birthday": "2025-09-18"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Richard",
    "lastName": "Lord",
    "title": "MD",
    "birthday": "2025-09-18"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Hannelie",
    "lastName": "Parkes",
    "title": "Implementation Planner/Buyer",
    "birthday": "2025-09-19"
  },
  {
    "company": "UMWW",
    "type": "AGENCY",
    "firstName": "Aluwani",
    "lastName": "Ramukhadi",
    "title": "Account Manager",
    "birthday": "2025-09-19"
  },
  {
    "company": "OMD",
    "type": "AGENCY",
    "firstName": "Lauren",
    "lastName": "Solomans",
    "title": "Digital Ad Ops Manager",
    "birthday": "2025-09-19"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Bucksy",
    "lastName": "Matlala",
    "title": "Social Specialist",
    "birthday": "2026-09-21"
  },
  {
    "company": "Amplify",
    "type": "AGENCY",
    "firstName": "Nicolette",
    "lastName": "Arries",
    "title": "Media Buyer",
    "birthday": "2025-09-22"
  },
  {
    "company": "Posterscope",
    "type": "AGENCY",
    "firstName": "Carmen",
    "lastName": "Freemantle",
    "title": "Production",
    "birthday": "2025-09-23"
  },
  {
    "company": "OMG Jhb",
    "type": "AGENCY",
    "firstName": "Samantha",
    "lastName": "Lyons",
    "title": "OOH Planner",
    "birthday": "2025-09-23"
  },
  {
    "company": "Joe Public",
    "type": "AGENCY",
    "firstName": "Nompumelo",
    "lastName": "Mabena",
    "title": null,
    "birthday": "2025-09-26"
  },
  {
    "company": "OMD",
    "type": "AGENCY",
    "firstName": "Samantha",
    "lastName": "Lewis",
    "title": "Media Buyer",
    "birthday": "2025-09-29"
  },
  {
    "company": "Carat Cpt",
    "type": "AGENCY",
    "firstName": "Nadia",
    "lastName": "Jackson",
    "title": "Media Planner",
    "birthday": "2025-09-30"
  },
  {
    "company": "Phd Jhb",
    "type": "AGENCY",
    "firstName": "Judith",
    "lastName": "Spies",
    "title": "Planner",
    "birthday": "2025-10-01"
  },
  {
    "company": "Media Mix 360",
    "type": "AGENCY",
    "firstName": "Tracy",
    "lastName": "Urdang",
    "title": "Media Planner",
    "birthday": "2025-10-01"
  },
  {
    "company": "OMG Durban",
    "type": "AGENCY",
    "firstName": "Ivor",
    "lastName": "Chalmers",
    "title": "OOH Manager",
    "birthday": "2025-10-02"
  },
  {
    "company": "Joe Public",
    "type": "AGENCY",
    "firstName": "Lisa",
    "lastName": "Moir",
    "title": "Senior Media Planner",
    "birthday": "2025-10-02"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Busisiwe",
    "lastName": "Phakathi",
    "title": "Senior Media Planner",
    "birthday": "2026-10-02"
  },
  {
    "company": "Meta Media - JHB",
    "type": "AGENCY",
    "firstName": "Bianca",
    "lastName": "Petersen",
    "title": "Implementation Executive",
    "birthday": "2025-10-04"
  },
  {
    "company": "Meta Media - JHB",
    "type": "AGENCY",
    "firstName": "Meche",
    "lastName": "Le Fleur",
    "title": "Media Planner",
    "birthday": "2025-10-04"
  },
  {
    "company": "Dentsu",
    "type": "AGENCY",
    "firstName": "Shamiesa",
    "lastName": "Miller",
    "title": "Account Director",
    "birthday": "2025-10-06"
  },
  {
    "company": "M&C Connect",
    "type": "AGENCY",
    "firstName": "Melissa",
    "lastName": "van Zyl",
    "title": "Media Consult|\\Strategy",
    "birthday": "2025-10-08"
  },
  {
    "company": "UMWW",
    "type": "AGENCY",
    "firstName": "Oscar",
    "lastName": "Onyach",
    "title": "Client Lead",
    "birthday": "2025-10-09"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Keshni",
    "lastName": "Naiker",
    "title": "Media Buyer",
    "birthday": "2026-10-09"
  },
  {
    "company": "UMWW",
    "type": "AGENCY",
    "firstName": "Leigh",
    "lastName": "Dasrath",
    "title": "Account Manager",
    "birthday": "2025-10-11"
  },
  {
    "company": "Carat Cpt",
    "type": "AGENCY",
    "firstName": "Tandile",
    "lastName": "Ntlatleng",
    "title": "Account Executive",
    "birthday": "2025-10-11"
  },
  {
    "company": "Dentsu",
    "type": "AGENCY",
    "firstName": "Nikho",
    "lastName": "Rudah",
    "title": "Strategic Lead",
    "birthday": "2025-10-12"
  },
  {
    "company": "Carat Cpt",
    "type": "AGENCY",
    "firstName": "Farieda",
    "lastName": "Taliep",
    "title": "Planner",
    "birthday": "2025-10-15"
  },
  {
    "company": "Wavemakers",
    "type": "AGENCY",
    "firstName": "Mashilo",
    "lastName": "Magongoa",
    "title": "Planner",
    "birthday": "2025-10-15"
  },
  {
    "company": "Carat Cpt",
    "type": "AGENCY",
    "firstName": "Noluthando",
    "lastName": "Mdluli",
    "title": "Jnr Media Planner",
    "birthday": "2025-10-16"
  },
  {
    "company": "Pick n Pay",
    "type": "CLIENT",
    "firstName": "Jo-Ann",
    "lastName": "Chetty",
    "title": "Planner",
    "birthday": "2025-10-16"
  },
  {
    "company": "Carat Cpt",
    "type": "AGENCY",
    "firstName": "Frances",
    "lastName": "Swartz",
    "title": "Account Manager",
    "birthday": "2025-10-18"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Evile",
    "lastName": "Sombo",
    "title": "Out of Home Specialists",
    "birthday": "2026-10-18"
  },
  {
    "company": "Penquin",
    "type": "CLIENT",
    "firstName": "Tsholofelo",
    "lastName": "Makwatse",
    "title": "Buyer",
    "birthday": "2025-10-19"
  },
  {
    "company": "Phd Cpt",
    "type": "AGENCY",
    "firstName": "Kimon",
    "lastName": "Sitas",
    "title": "Group Director",
    "birthday": "2025-10-19"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Bonita",
    "lastName": "Bachmann",
    "title": "Managing Director",
    "birthday": "2025-10-20"
  },
  {
    "company": "Betway",
    "type": "CLIENT",
    "firstName": "Haveshan",
    "lastName": "Naidoo",
    "title": "Marketing Manager",
    "birthday": "2025-10-20"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Mercy",
    "lastName": "Pule",
    "title": "Integrated Media Strategist",
    "birthday": "2026-10-20"
  },
  {
    "company": "TMS",
    "type": "AGENCY",
    "firstName": "Bonita",
    "lastName": "Lotter",
    "title": "Media Planner",
    "birthday": "2025-10-21"
  },
  {
    "company": "Media Mix 360",
    "type": "AGENCY",
    "firstName": "Adam",
    "lastName": "Phiri",
    "title": "New Business Developer",
    "birthday": "2025-10-22"
  },
  {
    "company": "UMWW",
    "type": "AGENCY",
    "firstName": "Rene",
    "lastName": "Wagener",
    "title": "Senior Planner",
    "birthday": "2025-10-25"
  },
  {
    "company": "UM",
    "type": "AGENCY",
    "firstName": "Mlue",
    "lastName": "Maguba",
    "title": "Client Lead",
    "birthday": "2025-10-25"
  },
  {
    "company": "Joe Public",
    "type": "AGENCY",
    "firstName": "Kamohelo",
    "lastName": "Moeti",
    "title": "Social Media Manager",
    "birthday": "2025-10-26"
  },
  {
    "company": "Carat Cpt",
    "type": "AGENCY",
    "firstName": "Lerina",
    "lastName": "Bierman",
    "title": "Group Managing Director",
    "birthday": "2025-10-26"
  },
  {
    "company": "Phd Jhb",
    "type": "AGENCY",
    "firstName": "Cindy",
    "lastName": "Beyer",
    "title": "Freelance",
    "birthday": "2025-10-27"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Godfrey",
    "lastName": "Gqaji",
    "title": "Grammatic Specialist",
    "birthday": "2026-10-27"
  },
  {
    "company": "e.tv",
    "type": "CLIENT",
    "firstName": "Lynn",
    "lastName": "Adams",
    "title": "Marketing Director",
    "birthday": "2025-10-29"
  },
  {
    "company": "99c",
    "type": "CLIENT",
    "firstName": "Vonda",
    "lastName": "Meekin-Wilcox",
    "title": null,
    "birthday": "2025-10-30"
  },
  {
    "company": "Meta Media - JHB",
    "type": "AGENCY",
    "firstName": "Kagiso",
    "lastName": "Musi",
    "title": "Group Managing Director",
    "birthday": "2025-10-31"
  },
  {
    "company": "UMWW",
    "type": "AGENCY",
    "firstName": "Moroesi",
    "lastName": "Matoase",
    "title": "Buyer",
    "birthday": "2025-11-01"
  },
  {
    "company": "UMWW",
    "type": "AGENCY",
    "firstName": "Keshlan",
    "lastName": "Naidu",
    "title": "Media Planner",
    "birthday": "2025-11-02"
  },
  {
    "company": "Carat Cpt",
    "type": "AGENCY",
    "firstName": "Ethan",
    "lastName": "De Cock",
    "title": "Account Manager",
    "birthday": "2025-11-02"
  },
  {
    "company": "Phd Cpt",
    "type": "AGENCY",
    "firstName": "Junaid",
    "lastName": "Jakoet",
    "title": "Performance Specialist",
    "birthday": "2025-11-03"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Peter",
    "lastName": "Lindstroom",
    "title": "OOH Manager",
    "birthday": "2025-11-03"
  },
  {
    "company": "Phd Jhb",
    "type": "AGENCY",
    "firstName": "Anneke",
    "lastName": "Van Zyl",
    "title": "Insights Lead",
    "birthday": "2025-11-04"
  },
  {
    "company": "Carat Cpt",
    "type": "AGENCY",
    "firstName": "Jared",
    "lastName": "Hendricks",
    "title": "Account Director",
    "birthday": "2025-11-05"
  },
  {
    "company": "Amplify",
    "type": "AGENCY",
    "firstName": "Insauf",
    "lastName": "Samie",
    "title": "Media Buyer",
    "birthday": "2025-11-05"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Zakkiyya",
    "lastName": "Ahmed",
    "title": "Account Manager",
    "birthday": "2025-11-06"
  },
  {
    "company": "Carat Cpt",
    "type": "AGENCY",
    "firstName": "Luke",
    "lastName": "Pillay",
    "title": "Account Executive",
    "birthday": "2025-11-07"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Miranda",
    "lastName": "Parkes",
    "title": "Media Buyer",
    "birthday": "2026-11-07"
  },
  {
    "company": "Zenith",
    "type": "AGENCY",
    "firstName": "Sarah",
    "lastName": "Kennedy(Cape Town)",
    "title": "Digital Strategic Lead",
    "birthday": "2026-11-08"
  },
  {
    "company": "Kintaro",
    "type": "AGENCY",
    "firstName": "Jenny",
    "lastName": "Barenbrug",
    "title": "Strategist",
    "birthday": "2025-11-09"
  },
  {
    "company": "UMWW",
    "type": "AGENCY",
    "firstName": "Neo",
    "lastName": "Monareng",
    "title": "UM Freelancer",
    "birthday": "2025-11-10"
  },
  {
    "company": "Ivie Media",
    "type": "AGENCY",
    "firstName": "Angela",
    "lastName": "Franken",
    "title": "Media Manager",
    "birthday": "2025-11-11"
  },
  {
    "company": "Carat Cpt",
    "type": "AGENCY",
    "firstName": "Izolde",
    "lastName": "Kriel",
    "title": "Digital Strategist",
    "birthday": "2025-11-11"
  },
  {
    "company": "99c",
    "type": "CLIENT",
    "firstName": "Samantha",
    "lastName": "Ryklief",
    "title": null,
    "birthday": "2025-11-11"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Samelwa",
    "lastName": "Mhlaba",
    "title": "Reporting Analyst",
    "birthday": "2025-11-11"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Claire",
    "lastName": "Saunders",
    "title": "Senior ATL Planner",
    "birthday": "2025-11-12"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Estie",
    "lastName": "Begemann",
    "title": "Implementation Planner / Buyer",
    "birthday": "2026-11-12"
  },
  {
    "company": "UMWW",
    "type": "AGENCY",
    "firstName": "Jane",
    "lastName": "Jansen van Vuuren",
    "title": "Senior Buyer",
    "birthday": "2025-11-13"
  },
  {
    "company": "Carat Cpt",
    "type": "AGENCY",
    "firstName": "Tinita",
    "lastName": "Flint",
    "title": "Account Manager",
    "birthday": "2025-11-13"
  },
  {
    "company": "Carat Cpt",
    "type": "AGENCY",
    "firstName": "Julianne",
    "lastName": "Klingenberg",
    "title": "Media Intern",
    "birthday": "2025-11-14"
  },
  {
    "company": "Zenith",
    "type": "AGENCY",
    "firstName": "Shivani",
    "lastName": "Maharaj",
    "title": "Digital Planner",
    "birthday": "2026-11-14"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Michelle",
    "lastName": "Waddell",
    "title": "Junior Financial Controller",
    "birthday": "2026-11-16"
  },
  {
    "company": "Phd Cpt",
    "type": "AGENCY",
    "firstName": "Christian",
    "lastName": "Petersen",
    "title": "Performance Specialist",
    "birthday": "2025-11-18"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Penny",
    "lastName": "Buyana",
    "title": "Receptionist",
    "birthday": "2025-11-18"
  },
  {
    "company": "UM",
    "type": "AGENCY",
    "firstName": "Bruce",
    "lastName": "Williamson",
    "title": "Group Strategy Director",
    "birthday": "2025-11-21"
  },
  {
    "company": "Initiative Media",
    "type": "AGENCY",
    "firstName": "Lesley",
    "lastName": "Levy",
    "title": "Media Analyst",
    "birthday": "2026-11-21"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Phumla",
    "lastName": "Zulu",
    "title": "Junior Media Buyer",
    "birthday": "2025-11-23"
  },
  {
    "company": "Meta Media - JHB",
    "type": "AGENCY",
    "firstName": "Yonela",
    "lastName": "Mabulu",
    "title": "Media Buyer",
    "birthday": "2025-11-23"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Kim",
    "lastName": "Hooper",
    "title": "Financial Co-Ordinator",
    "birthday": "2026-11-23"
  },
  {
    "company": "Carat Cpt",
    "type": "AGENCY",
    "firstName": "Kurt",
    "lastName": "Daries",
    "title": "Account Manager",
    "birthday": "2025-11-24"
  },
  {
    "company": "MJ Media",
    "type": "AGENCY",
    "firstName": "Mandy",
    "lastName": "Johnson",
    "title": null,
    "birthday": "2025-11-25"
  },
  {
    "company": "Brandright",
    "type": "AGENCY",
    "firstName": "Maretha",
    "lastName": "(no surname given)",
    "title": "marketing",
    "birthday": "2025-11-25"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Katherine",
    "lastName": "Couzyn",
    "title": "Managing Director - Havas Media SA",
    "birthday": "2025-11-28"
  },
  {
    "company": "Primedia Broadcasting",
    "type": "AGENCY",
    "firstName": "Buntu",
    "lastName": "Mkize",
    "title": null,
    "birthday": "2025-11-28"
  },
  {
    "company": "Carat Jhb",
    "type": "AGENCY",
    "firstName": "Rona",
    "lastName": "van Wyk",
    "title": "Account Director",
    "birthday": "2025-11-29"
  },
  {
    "company": "Initiative Media",
    "type": "AGENCY",
    "firstName": "Widaad",
    "lastName": "Ismail",
    "title": "Channel Planner",
    "birthday": "2025-11-29"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Ronel",
    "lastName": "De Kock",
    "title": "Media Planner",
    "birthday": "2026-11-29"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Gloria",
    "lastName": "Masilo",
    "title": "Media Buyer",
    "birthday": "2026-11-30"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Natasha",
    "lastName": "Venter",
    "title": "Senior Media Planner",
    "birthday": "2026-11-30"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Oratile",
    "lastName": "Bojabotseha",
    "title": "Trafficking Administrator",
    "birthday": "2026-11-30"
  },
  {
    "company": "MJ Media",
    "type": "AGENCY",
    "firstName": "Rae",
    "lastName": "Robson",
    "title": "Production",
    "birthday": "2025-12-01"
  },
  {
    "company": "Duck 'n Craig",
    "type": "CLIENT",
    "firstName": "Nic",
    "lastName": "(no surname given)",
    "title": "Owner",
    "birthday": "2025-12-02"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Caron",
    "lastName": "Collet",
    "title": "Media Buyer",
    "birthday": "2025-12-05"
  },
  {
    "company": "UM",
    "type": "AGENCY",
    "firstName": "Thabiso",
    "lastName": "Yanta",
    "title": "Insights Lead",
    "birthday": "2025-12-06"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Maletsatsi",
    "lastName": "Mhlotshazana",
    "title": "Reporting Specialist",
    "birthday": "2026-12-06"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Jamila",
    "lastName": "Seedat",
    "title": "Investment Director",
    "birthday": "2025-12-08"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Tania",
    "lastName": "Magalhaes",
    "title": "Media Buyer",
    "birthday": "2025-12-08"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Jamila",
    "lastName": "Seedat",
    "title": "Investment Director",
    "birthday": "2025-12-08"
  },
  {
    "company": "Hi-Tec",
    "type": "CLIENT",
    "firstName": "Louise",
    "lastName": "White",
    "title": "Marketing Manager?",
    "birthday": "2025-12-09"
  },
  {
    "company": "Meta Media - CPT",
    "type": "AGENCY",
    "firstName": "Lara",
    "lastName": "Bredeveldt",
    "title": "Senior Strategic Planner",
    "birthday": "2026-12-10"
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Cindy",
    "lastName": "Pienaar",
    "title": "Strategist",
    "birthday": "2026-12-10"
  },
  {
    "company": "Joe Public",
    "type": "AGENCY",
    "firstName": "Meghan",
    "lastName": "Ferguson",
    "title": "Head of Performance",
    "birthday": "2025-12-11"
  },
  {
    "company": "Carat Cpt",
    "type": "AGENCY",
    "firstName": "Dayle",
    "lastName": "Fortune",
    "title": "Account Manager",
    "birthday": "2025-12-12"
  },
  {
    "company": "Zenith",
    "type": "AGENCY",
    "firstName": "Adele",
    "lastName": "Bekker",
    "title": "Client Portfolio Lead",
    "birthday": "2025-12-13"
  },
  {
    "company": "Joe Public",
    "type": "AGENCY",
    "firstName": "Christopher",
    "lastName": "Els",
    "title": "Performance Specialist",
    "birthday": "2025-12-13"
  },
  {
    "company": "Meta Media - CPT",
    "type": "AGENCY",
    "firstName": "Andrea",
    "lastName": "Leeuwner",
    "title": "Media Director",
    "birthday": "2025-12-13"
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Winile",
    "lastName": "Masilela",
    "title": "Strategist",
    "birthday": "2026-12-13"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Shantell",
    "lastName": "Samuel",
    "title": "Strategic Planning Lead",
    "birthday": "2025-12-14"
  },
  {
    "company": "Carat Cpt",
    "type": "AGENCY",
    "firstName": "Luke",
    "lastName": "von Willingh",
    "title": "Media Intern",
    "birthday": "2025-12-15"
  },
  {
    "company": "Mediology",
    "type": "AGENCY",
    "firstName": "Amogelang",
    "lastName": "Ledwaba",
    "title": "Intern",
    "birthday": "2026-12-16"
  },
  {
    "company": "Carat Cpt",
    "type": "AGENCY",
    "firstName": "Jean",
    "lastName": "Rimmer",
    "title": "Account Manager",
    "birthday": "2025-12-17"
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Vutlharhi",
    "lastName": "Sibisi",
    "title": "Junior Reporting Specialist",
    "birthday": "2026-12-18"
  },
  {
    "company": "Connect Media Group",
    "type": "AGENCY",
    "firstName": "Jarrod",
    "lastName": "Pottow",
    "title": "Owner",
    "birthday": "2025-12-20"
  },
  {
    "company": "Joe Public",
    "type": "AGENCY",
    "firstName": "Ntiyiso",
    "lastName": "Maluleke",
    "title": "Junior Buyer",
    "birthday": "2025-12-21"
  },
  {
    "company": "Duck 'n Craig",
    "type": "CLIENT",
    "firstName": "Gillian",
    "lastName": "(no surname given)",
    "title": "Marketing",
    "birthday": "2025-12-22"
  },
  {
    "company": "Carat Cpt",
    "type": "AGENCY",
    "firstName": "Jayden",
    "lastName": "Francis",
    "title": "Media Intern",
    "birthday": "2025-12-24"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Krista",
    "lastName": "Morton",
    "title": "Senior Media Planner",
    "birthday": "2026-12-25"
  },
  {
    "company": "OMD",
    "type": "AGENCY",
    "firstName": "Warda",
    "lastName": "Rahim",
    "title": "Media Buyer",
    "birthday": "2025-12-26"
  },
  {
    "company": "Joe Public",
    "type": "AGENCY",
    "firstName": "Lynette",
    "lastName": "Lourens",
    "title": "Financial Manager",
    "birthday": "2025-12-28"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Jeannette",
    "lastName": "Saayman",
    "title": "Buying Manager / Implementation Planner",
    "birthday": "2026-12-27"
  },
  {
    "company": "OMG Jhb",
    "type": "AGENCY",
    "firstName": "Chantelle",
    "lastName": "Triegaardt",
    "title": "OOH Planner",
    "birthday": "2025-12-29"
  },
  {
    "company": "Fox Five Media",
    "type": "AGENCY",
    "firstName": "Christopher",
    "lastName": "Kieffer",
    "title": "CEO",
    "birthday": "2025-12-29"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Christine",
    "lastName": "Brinded",
    "title": "Media Buyer",
    "birthday": "2026-12-29"
  },
  {
    "company": "Mediashop",
    "type": "AGENCY",
    "firstName": "Maryke",
    "lastName": "Swart",
    "title": "Media Buyer",
    "birthday": "2025-12-31"
  },
  {
    "company": "Havas MG",
    "type": "AGENCY",
    "firstName": "Conny",
    "lastName": "Seoposengwe",
    "title": "Account Manager",
    "birthday": "2025-12-31"
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Akram",
    "lastName": "Hakrim",
    "title": "Digital Planner",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Anny",
    "lastName": "Schramm",
    "title": "BUD",
    "birthday": null
  },
  {
    "company": "MSC Sports",
    "type": "AGENCY",
    "firstName": "Bertine",
    "lastName": "(no surname given)",
    "title": "Strategist",
    "birthday": null
  },
  {
    "company": "Clicks",
    "type": "CLIENT",
    "firstName": "Chad",
    "lastName": "(no surname given)",
    "title": "Marketing",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Colson",
    "lastName": "Mothoagae",
    "title": "BUD",
    "birthday": null
  },
  {
    "company": "Hirsch's",
    "type": "CLIENT",
    "firstName": "Devashen",
    "lastName": "(no surname given)",
    "title": "marketing",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Jaco",
    "lastName": "Van Jaarsveld",
    "title": "Strategist",
    "birthday": null
  },
  {
    "company": "SEDGARS HOME",
    "type": "AGENCY",
    "firstName": "JR",
    "lastName": "(no surname given)",
    "title": "Marketing",
    "birthday": null
  },
  {
    "company": "OMG Jhb",
    "type": "AGENCY",
    "firstName": "Kgotso",
    "lastName": "Tsagae",
    "title": "Digital Strategist",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Kogie",
    "lastName": "Shunmugam",
    "title": "Quality Assurer",
    "birthday": null
  },
  {
    "company": "SOLY",
    "type": "CLIENT",
    "firstName": "Layla",
    "lastName": "(no surname given)",
    "title": "Marketing manager",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Lerato",
    "lastName": "Matjila",
    "title": "Digital Planner",
    "birthday": null
  },
  {
    "company": "Aliens Nation",
    "type": "CLIENT",
    "firstName": "Mala",
    "lastName": "(no surname given)",
    "title": "Managing Director",
    "birthday": null
  },
  {
    "company": "Western Cape Blood Services",
    "type": "CLIENT",
    "firstName": "Marike",
    "lastName": "Carli",
    "title": "Marketing Manager",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Michelle",
    "lastName": "(no surname given)",
    "title": "Planner",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Mogini",
    "lastName": "Govender",
    "title": "BUD",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Nenette",
    "lastName": "(no surname given)",
    "title": "Planner",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Nkosinathi",
    "lastName": "Xashimba",
    "title": "Digital Planner",
    "birthday": null
  },
  {
    "company": "ZOHO",
    "type": "CLIENT",
    "firstName": "Nothando",
    "lastName": "(no surname given)",
    "title": "Regional Marketing",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Olivia",
    "lastName": "Temple",
    "title": "Digital Planner",
    "birthday": null
  },
  {
    "company": "Hurley",
    "type": "CLIENT",
    "firstName": "Paul",
    "lastName": "(no surname given)",
    "title": "Brand Manager",
    "birthday": null
  },
  {
    "company": "ZOHO",
    "type": "CLIENT",
    "firstName": "Pinky",
    "lastName": "(no surname given)",
    "title": "Marketing",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Sibusiso",
    "lastName": "Mbongo",
    "title": "Strategist",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Thami",
    "lastName": "Tshabalala",
    "title": "BUD",
    "birthday": null
  },
  {
    "company": "ZOHO",
    "type": "CLIENT",
    "firstName": "Vaishanavi",
    "lastName": "(no surname given)",
    "title": "Head of Marketing",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Vanessa",
    "lastName": "Spiller",
    "title": "Media Buyer",
    "birthday": null
  },
  {
    "company": "Zenith",
    "type": "AGENCY",
    "firstName": "Balegugu",
    "lastName": "Ndlovu",
    "title": "Digitas Strategy Lead",
    "birthday": null
  },
  {
    "company": "Zenith",
    "type": "AGENCY",
    "firstName": "Reg",
    "lastName": "West",
    "title": "Digital Strategist & Portfolio Lead",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Alicia",
    "lastName": "Campher",
    "title": "Media Planner",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Andries",
    "lastName": "Erasmus",
    "title": "Head of Media Execution and Operations",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Atlegang",
    "lastName": "Maluleka",
    "title": "Social speialist media",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Brain",
    "lastName": "Muguto",
    "title": "Head of Strategy",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Chrizelda",
    "lastName": "Viljoen",
    "title": "Head of Digital AdOps",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Coogan",
    "lastName": "Pillay",
    "title": "Head of Data & Technology",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Itumeleng",
    "lastName": "Thuso",
    "title": "Media Operations Coordinator",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Jarred",
    "lastName": "Trembath",
    "title": "Head of b2b Affilliate & Performance Influencer Marketing",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Mamosidi",
    "lastName": "Molefe",
    "title": "Reporting Specialist",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Merve",
    "lastName": "Yediel",
    "title": "Performance Media Executive(Turkey)",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Michael",
    "lastName": "Viljoen",
    "title": "Senior Performance Director",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Phindulo",
    "lastName": "Matenzhe",
    "title": "Media Buyer",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Relebogile",
    "lastName": "Leepile",
    "title": "Ad ops Specialist",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Shikaar",
    "lastName": "Juglall",
    "title": "Managing Director",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Thabo",
    "lastName": "Moloi",
    "title": "Ad ops Specialist",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Thobekile",
    "lastName": "Radebe",
    "title": "OOH Specialist",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Thami",
    "lastName": "Tshabalala",
    "title": "BUD",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Tshegofatso",
    "lastName": "Makibinye",
    "title": "Data Scientist",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Uviwe",
    "lastName": "Mbadla",
    "title": "Social & Programmatic Implementation",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Lisa",
    "lastName": "Dayaram",
    "title": "junior research & media analyst",
    "birthday": null
  },
  {
    "company": "Publicis Jhb",
    "type": "AGENCY",
    "firstName": "Oko",
    "lastName": "Maqutu",
    "title": "Media Buyer",
    "birthday": null
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Ashley",
    "lastName": "Alexander",
    "title": "Digital Media Planner",
    "birthday": null
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Cheslyn",
    "lastName": "Albertus",
    "title": "Digital Media Strategist",
    "birthday": null
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Cordelia",
    "lastName": "Moyo",
    "title": "Media Strategist",
    "birthday": null
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Dineo",
    "lastName": "Kolatsoeu",
    "title": "ALT Planner",
    "birthday": null
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Faiyaz",
    "lastName": "Ajam",
    "title": "Performance Strategist",
    "birthday": null
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Fauzia",
    "lastName": "Rylands",
    "title": "Aro Media Strategy Lead",
    "birthday": null
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Kayla",
    "lastName": "Freitas",
    "title": "Hybrid Strategist",
    "birthday": null
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Lerato",
    "lastName": "Matjila",
    "title": "Digital Planning",
    "birthday": null
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Makgotso",
    "lastName": "Ndaliso",
    "title": "Digital Planner",
    "birthday": null
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Matthew",
    "lastName": "Landon",
    "title": "Digital Media Strategist",
    "birthday": null
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Melissa",
    "lastName": "Lee- Read",
    "title": "ATL Planner",
    "birthday": null
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Moshini",
    "lastName": "Ambrose",
    "title": "Digital Strategist",
    "birthday": null
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Nenette",
    "lastName": "De Lange",
    "title": "ATL Media Planner",
    "birthday": null
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Nombuso",
    "lastName": "Nxumalo",
    "title": "ATL Planning",
    "birthday": null
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Shonisani",
    "lastName": "Masidwali",
    "title": "Senior Strategist",
    "birthday": null
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Tania",
    "lastName": "Magalhaes",
    "title": "ATL Media Planner",
    "birthday": null
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Thato",
    "lastName": "Faku",
    "title": "Hybrid Planner",
    "birthday": null
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Valerie",
    "lastName": "Maseko",
    "title": "Hybrid Planner",
    "birthday": null
  },
  {
    "company": "Starcom",
    "type": "AGENCY",
    "firstName": "Glen",
    "lastName": "Attwell",
    "title": "Business Unit Director",
    "birthday": null
  },
  {
    "company": "Toyota Team (Publicis)",
    "type": "AGENCY",
    "firstName": "Bronwyn",
    "lastName": "Joubert",
    "title": "BUD [ Freelance ]",
    "birthday": null
  },
  {
    "company": "Toyota Team (Publicis)",
    "type": "AGENCY",
    "firstName": "Kim",
    "lastName": "Kenloff",
    "title": "Digital Media Planner",
    "birthday": null
  },
  {
    "company": "Toyota Team (Publicis)",
    "type": "AGENCY",
    "firstName": "Phillip",
    "lastName": "Kamungoma",
    "title": "Digital Strategist",
    "birthday": null
  },
  {
    "company": "Toyota Team (Publicis)",
    "type": "AGENCY",
    "firstName": "Teslyn",
    "lastName": "Francis",
    "title": "Digital Media Planner",
    "birthday": null
  },
  {
    "company": "Toyota Team (Publicis)",
    "type": "AGENCY",
    "firstName": "Zandi",
    "lastName": "Manini",
    "title": "Media Planner",
    "birthday": null
  },
  {
    "company": "Publicis (Research and Insights)",
    "type": "AGENCY",
    "firstName": "Chicco",
    "lastName": "Zimila",
    "title": "Data Analyst",
    "birthday": null
  },
  {
    "company": "Publicis (Research and Insights)",
    "type": "AGENCY",
    "firstName": "David",
    "lastName": "Mokgohloa",
    "title": "Data Analyst",
    "birthday": null
  },
  {
    "company": "Publicis (Research and Insights)",
    "type": "AGENCY",
    "firstName": "Lisa",
    "lastName": "Dayaram",
    "title": "Junior Research & Insights Analyst",
    "birthday": null
  },
  {
    "company": "Nestle Media Team (Publicis)",
    "type": "AGENCY",
    "firstName": "Bradley",
    "lastName": "Aigner",
    "title": "ALT Strategist & BUD",
    "birthday": null
  },
  {
    "company": "Nestle Media Team (Publicis)",
    "type": "AGENCY",
    "firstName": "Brenda",
    "lastName": "Mapane",
    "title": "ALT Strategist & BUD",
    "birthday": null
  },
  {
    "company": "Nestle Media Team (Publicis)",
    "type": "AGENCY",
    "firstName": "Koena",
    "lastName": "Teffo",
    "title": "OOH Planner",
    "birthday": null
  },
  {
    "company": "Nestle Media Team (Publicis)",
    "type": "AGENCY",
    "firstName": "Letago",
    "lastName": "Mahlangu",
    "title": "ATL Media Planner",
    "birthday": null
  },
  {
    "company": "Nestle Media Team (Publicis)",
    "type": "AGENCY",
    "firstName": "Lucia",
    "lastName": "Rabali",
    "title": "ATL Planner & Account Manager",
    "birthday": null
  },
  {
    "company": "Nestle Media Team (Publicis)",
    "type": "AGENCY",
    "firstName": "Michaela",
    "lastName": "Nariansamy",
    "title": "Media Buyer",
    "birthday": null
  },
  {
    "company": "Nestle Media Team (Publicis)",
    "type": "AGENCY",
    "firstName": "Michelle",
    "lastName": "Fourie",
    "title": "Country Media Lead",
    "birthday": null
  },
  {
    "company": "Nestle Media Team (Publicis)",
    "type": "AGENCY",
    "firstName": "Natasha",
    "lastName": "Jacobs",
    "title": "Digital Strategist",
    "birthday": null
  },
  {
    "company": "Nestle Media Team (Publicis)",
    "type": "AGENCY",
    "firstName": "Pearl",
    "lastName": "Malunga",
    "title": "Data Analyst",
    "birthday": null
  },
  {
    "company": "Nestle Media Team (Publicis)",
    "type": "AGENCY",
    "firstName": "Thabitha",
    "lastName": "Tlabano",
    "title": "Senior Media Buyer",
    "birthday": null
  },
  {
    "company": "Nestle Media Team (Publicis)",
    "type": "AGENCY",
    "firstName": "Tshepo",
    "lastName": "Madibo",
    "title": "Digital Media Planner",
    "birthday": null
  },
  {
    "company": "Nestle Media Team (Publicis)",
    "type": "AGENCY",
    "firstName": "Tristan",
    "lastName": "Wesson",
    "title": "Digital Media Planner",
    "birthday": null
  }
];

async function main() {
  const category = await prisma.category.findFirst({
    where: { mainCategory: "Media and Entertainment", subcategory: null },
  });
  if (!category) {
    throw new Error(
      'Could not find the "Media and Entertainment" category - make sure prisma/seed.ts has run.'
    );
  }

  const salesTeam = await prisma.user.findMany({
    where: { role: "SALES" },
    orderBy: { name: "asc" },
  });
  if (salesTeam.length === 0) {
    throw new Error("No Sales users found - make sure prisma/seed.ts has run.");
  }

  // Companies with no agency/company name in the spreadsheet land here.
  const UNASSIGNED_COMPANY = "Unassigned / No Company Listed";

  const accountIdByName = new Map<string, string>();
  let created = 0;
  let reused = 0;
  let salesIndex = 0;

  for (const company of COMPANIES) {
    const existing = await prisma.account.findFirst({
      where: { name: { equals: company.name, mode: "insensitive" } },
    });
    if (existing) {
      accountIdByName.set(company.name, existing.id);
      reused++;
      continue;
    }
    const salesExecutive = salesTeam[salesIndex % salesTeam.length];
    salesIndex++;
    const account = await prisma.account.create({
      data: {
        name: company.name,
        type: company.type === "AGENCY" ? AccountType.AGENCY : AccountType.CLIENT,
        tier: AccountTier.TIER_3,
        categoryId: category.id,
        fiscalYearStart: FiscalYearStart.TO_BE_ASSIGNED,
        salesExecutiveId: salesExecutive.id,
      },
    });
    accountIdByName.set(company.name, account.id);
    created++;
  }

  console.log(`Accounts: ${created} created, ${reused} already existed and were reused.`);

  let contactsCreated = 0;
  for (const c of CONTACTS) {
    const companyName = c.company === "Unknown / No Company Listed" ? UNASSIGNED_COMPANY : c.company;
    let accountId = accountIdByName.get(companyName);
    if (!accountId) {
      // Handles the small number of contacts with no company listed at all.
      const existing = await prisma.account.findFirst({
        where: { name: { equals: UNASSIGNED_COMPANY, mode: "insensitive" } },
      });
      if (existing) {
        accountId = existing.id;
      } else {
        const salesExecutive = salesTeam[salesIndex % salesTeam.length];
        salesIndex++;
        const account = await prisma.account.create({
          data: {
            name: UNASSIGNED_COMPANY,
            type: AccountType.CLIENT,
            tier: AccountTier.TIER_3,
            categoryId: category.id,
            fiscalYearStart: FiscalYearStart.TO_BE_ASSIGNED,
            salesExecutiveId: salesExecutive.id,
          },
        });
        accountId = account.id;
      }
      accountIdByName.set(UNASSIGNED_COMPANY, accountId);
    }

    await prisma.contact.create({
      data: {
        accountId,
        firstName: c.firstName,
        lastName: c.lastName,
        title: c.title,
        birthday: c.birthday ? new Date(c.birthday) : null,
      },
    });
    contactsCreated++;
  }

  console.log(`Contacts: ${contactsCreated} created.`);
  console.log("Done. Placeholder fields to review in the app: Account Tier, Fiscal Year, and Sales Executive for every newly created Account (all set to defaults).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
