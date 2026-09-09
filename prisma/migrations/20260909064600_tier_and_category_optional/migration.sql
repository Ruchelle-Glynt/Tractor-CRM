-- AlterEnum
ALTER TYPE "AccountTier" ADD VALUE 'TO_BE_ASSIGNED';

-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_categoryId_fkey";

-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "categoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
