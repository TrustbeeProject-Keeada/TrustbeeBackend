/*
  Warnings:

  - You are about to drop the column `CV` on the `JobSeeker` table. All the data in the column will be lost.
  - You are about to drop the column `PersonalStatement` on the `JobSeeker` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "JobSeeker" DROP COLUMN "CV",
DROP COLUMN "PersonalStatement",
ADD COLUMN     "cv" TEXT,
ADD COLUMN     "personalStatement" TEXT;
