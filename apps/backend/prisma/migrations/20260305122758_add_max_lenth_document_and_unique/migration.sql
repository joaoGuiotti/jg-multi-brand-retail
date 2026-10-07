/*
  Warnings:

  - You are about to alter the column `document` on the `customers` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(14)`.
  - A unique constraint covering the columns `[document]` on the table `customers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "customers" ALTER COLUMN "document" SET DATA TYPE VARCHAR(14);

-- CreateIndex
CREATE UNIQUE INDEX "customers_document_key" ON "customers"("document");
