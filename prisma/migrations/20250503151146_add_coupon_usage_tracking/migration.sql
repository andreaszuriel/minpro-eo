-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "isUsed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "couponId" INTEGER;

-- CreateIndex
CREATE INDEX "Coupon_userId_isUsed_expiresAt_idx" ON "Coupon"("userId", "isUsed", "expiresAt");

-- CreateIndex
CREATE INDEX "Transaction_couponId_idx" ON "Transaction"("couponId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
