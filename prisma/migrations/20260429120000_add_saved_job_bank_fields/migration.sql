-- AlterTable
ALTER TABLE "SavedJob" ADD COLUMN     "job_bank_id" TEXT;

-- Drop NOT NULL constraint to allow job bank saves without DB job
ALTER TABLE "SavedJob" ALTER COLUMN "jobId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SavedJob_jobSeekerId_job_bank_id_key" ON "SavedJob"("jobSeekerId", "job_bank_id");
