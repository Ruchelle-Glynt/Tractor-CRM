-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CLIENT', 'AGENCY');

-- CreateEnum
CREATE TYPE "AccountTier" AS ENUM ('TIER_1', 'TIER_2', 'TIER_3');

-- CreateEnum
CREATE TYPE "FiscalYearStart" AS ENUM ('JAN_DEC', 'MAR_FEB', 'JUN_MAY');

-- CreateEnum
CREATE TYPE "DecisionRole" AS ENUM ('DECISION_MAKER', 'INFLUENCER', 'ADMINISTRATIVE');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('GIFT', 'EVENT', 'CAMPAIGN_DRIVE', 'CALL', 'MEETING', 'OTHER');

-- CreateEnum
CREATE TYPE "DealType" AS ENUM ('NON_TRADE', 'SPEND_COMMITMENT_DISCOUNT', 'VALUE_TRADE', 'MIXED_CASH_AND_TRADE', 'PURE_TRADE');

-- CreateEnum
CREATE TYPE "ManagedBy" AS ENUM ('MARKETING', 'SALES', 'FINANCE');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'PENDING', 'RENEWED');

-- CreateEnum
CREATE TYPE "RofrStatus" AS ENUM ('PENDING', 'CONFIRMED', 'LAPSED');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('CLASSIC', 'DIGITAL', 'PROGRAMMATIC');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE', 'SOCIAL', 'TELEPHONIC', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'LOST');

-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('BIRTHDAY', 'FISCAL_YEAR', 'CONTRACT_RENEWAL');

-- CreateEnum
CREATE TYPE "TriggerStage" AS ENUM ('MONTHLY_DIGEST', 'TWO_WEEK_REMINDER', 'TWO_DAY_REMINDER', 'DAY_OF_INTERNAL', 'DAY_OF_CLIENT');

-- CreateEnum
CREATE TYPE "TriggerStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SALES', 'MARKETING');

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "mainCategory" TEXT NOT NULL,
    "subcategory" TEXT,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "tier" "AccountTier" NOT NULL,
    "parentAgencyId" TEXT,
    "categoryId" TEXT NOT NULL,
    "subcategoryId" TEXT,
    "fiscalYearStart" "FiscalYearStart" NOT NULL,
    "mainContactId" TEXT,
    "salesExecutiveId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "title" TEXT,
    "decisionRole" "DecisionRole",
    "email" TEXT,
    "phone" TEXT,
    "birthday" TIMESTAMP(3),
    "interests" TEXT[],
    "familyPetNotes" TEXT,
    "personalityNotes" TEXT,
    "giftPreferences" TEXT,
    "giftRestrictions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "contactId" TEXT,
    "type" "ActivityType" NOT NULL,
    "description" TEXT,
    "activityDate" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,
    "value" DECIMAL(65,30),
    "externalReferenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "dealType" "DealType" NOT NULL,
    "description" TEXT,
    "cashValue" DECIMAL(65,30),
    "tradeValue" DECIMAL(65,30),
    "tradeValueType" TEXT,
    "spendCommitmentThreshold" DECIMAL(65,30),
    "discountRate" DECIMAL(65,30),
    "managedBy" "ManagedBy" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "hasFirstRightOfRefusal" BOOLEAN NOT NULL DEFAULT false,
    "rofrConfirmationDeadline" TIMESTAMP(3),
    "clientConfirmedRenewalAt" TIMESTAMP(3),
    "rofrStatus" "RofrStatus",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountGrowthMetric" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "channelType" "ChannelType",
    "spendAmount" DECIMAL(65,30) NOT NULL,
    "holdingSize" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountGrowthMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketBenchmark" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "categoryId" TEXT NOT NULL,
    "brand" TEXT,
    "captureDate" TIMESTAMP(3) NOT NULL,
    "estimatedMonthlySpend" DECIMAL(65,30),
    "holdingSizeExternal" DECIMAL(65,30),
    "sourceName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketBenchmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "source" "LeadSource" NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "companyName" TEXT,
    "linkedAccountId" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "convertedValue" DECIMAL(65,30),
    "transferredToUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertedAt" TIMESTAMP(3),

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriggerLog" (
    "id" TEXT NOT NULL,
    "triggerType" "TriggerType" NOT NULL,
    "triggerStage" "TriggerStage" NOT NULL,
    "contactId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" "TriggerStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TriggerLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "emailSenderOverride" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_mainCategory_subcategory_key" ON "Category"("mainCategory", "subcategory");

-- CreateIndex
CREATE UNIQUE INDEX "Account_mainContactId_key" ON "Account"("mainContactId");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_externalReferenceId_key" ON "Activity"("externalReferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountGrowthMetric_accountId_period_channelType_key" ON "AccountGrowthMetric"("accountId", "period", "channelType");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_parentAgencyId_fkey" FOREIGN KEY ("parentAgencyId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_mainContactId_fkey" FOREIGN KEY ("mainContactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_salesExecutiveId_fkey" FOREIGN KEY ("salesExecutiveId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountGrowthMetric" ADD CONSTRAINT "AccountGrowthMetric_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketBenchmark" ADD CONSTRAINT "MarketBenchmark_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketBenchmark" ADD CONSTRAINT "MarketBenchmark_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_linkedAccountId_fkey" FOREIGN KEY ("linkedAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_transferredToUserId_fkey" FOREIGN KEY ("transferredToUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriggerLog" ADD CONSTRAINT "TriggerLog_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
