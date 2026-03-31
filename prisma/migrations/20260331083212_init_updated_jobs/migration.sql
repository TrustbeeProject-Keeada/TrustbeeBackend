/*
  Warnings:

  - The `profilePicture` column on the `JobSeeker` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `cv` column on the `JobSeeker` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "JobSeeker" DROP COLUMN "profilePicture",
ADD COLUMN     "profilePicture" BYTEA,
DROP COLUMN "cv",
ADD COLUMN     "cv" BYTEA;
