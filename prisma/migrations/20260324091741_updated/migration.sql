-- DropForeignKey
ALTER TABLE "Messages" DROP CONSTRAINT "Messages_receiverJobSeekerId_fkey";

-- DropForeignKey
ALTER TABLE "Messages" DROP CONSTRAINT "Messages_receiverRecruiterId_fkey";

-- DropForeignKey
ALTER TABLE "Messages" DROP CONSTRAINT "Messages_senderJobSeekerId_fkey";

-- AlterTable
ALTER TABLE "Messages" ALTER COLUMN "senderJobSeekerId" DROP NOT NULL,
ALTER COLUMN "senderRecruiterId" DROP NOT NULL,
ALTER COLUMN "receiverJobSeekerId" DROP NOT NULL,
ALTER COLUMN "receiverRecruiterId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_senderJobSeekerId_fkey" FOREIGN KEY ("senderJobSeekerId") REFERENCES "JobSeeker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_receiverJobSeekerId_fkey" FOREIGN KEY ("receiverJobSeekerId") REFERENCES "JobSeeker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_receiverRecruiterId_fkey" FOREIGN KEY ("receiverRecruiterId") REFERENCES "CompanyRecruiter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
