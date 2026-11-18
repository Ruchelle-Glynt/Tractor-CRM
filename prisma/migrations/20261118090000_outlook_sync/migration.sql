-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'EMAIL';

-- CreateTable
CREATE TABLE "OutlookConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "msEmail" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "lastLogged" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutlookConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OutlookConnection_userId_key" ON "OutlookConnection"("userId");

-- AddForeignKey
ALTER TABLE "OutlookConnection" ADD CONSTRAINT "OutlookConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
