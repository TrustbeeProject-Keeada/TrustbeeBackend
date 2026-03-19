/*
  Warnings:

  - You are about to drop the column `languages` on the `JobSeeker` table. All the data in the column will be lost.
  - You are about to drop the column `skills` on the `JobSeeker` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "JobSeeker" DROP COLUMN "languages",
DROP COLUMN "skills",
ALTER COLUMN "phoneNumber" DROP NOT NULL,
ALTER COLUMN "city" DROP NOT NULL,
ALTER COLUMN "bio" DROP NOT NULL,
ALTER COLUMN "portfolioLink" DROP NOT NULL;
