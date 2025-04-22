/*
  Warnings:

  - The `status` column on the `Transaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `basePrice` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentDeadline` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tierType` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'WAITING_ADMIN', 'PAID', 'EXPIRED', 'CANCELED');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "basePrice" INTEGER NOT NULL,
ADD COLUMN     "couponDiscount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paymentDeadline" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "pointsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ticketUrl" TEXT,
ADD COLUMN     "tierType" TEXT NOT NULL,
ADD COLUMN     "voucherUrl" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING';
