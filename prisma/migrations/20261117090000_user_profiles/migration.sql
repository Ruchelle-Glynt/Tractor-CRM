-- AlterTable
ALTER TABLE "User" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "office" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "photo" TEXT,
ADD COLUMN     "photoUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "title" TEXT;
