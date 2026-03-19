-- CreateEnum
CREATE TYPE "Role" AS ENUM ('JOB_SEEKER', 'COMPANY_RECRUITER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "JobSeeker" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'JOB_SEEKER',
    "phoneNumber" TEXT NOT NULL,
    "profilePicture" TEXT,
    "city" TEXT NOT NULL,
    "languages" TEXT[],
    "skills" TEXT[],
    "bio" TEXT NOT NULL,
    "portfolioLink" TEXT NOT NULL,
    "accountCompletionRate" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "JobSeeker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyRecruiter" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "organizationNumber" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "phoneNumber" INTEGER NOT NULL,
    "logoUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'COMPANY_RECRUITER',

    CONSTRAINT "CompanyRecruiter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Messages" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "senderJobSeekerId" INTEGER NOT NULL,
    "senderRecruiterId" INTEGER NOT NULL,
    "receiverJobSeekerId" INTEGER NOT NULL,
    "receiverRecruiterId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobSeeker_email_key" ON "JobSeeker"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyRecruiter_email_key" ON "CompanyRecruiter"("email");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyRecruiter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_senderJobSeekerId_fkey" FOREIGN KEY ("senderJobSeekerId") REFERENCES "JobSeeker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_senderRecruiterId_fkey" FOREIGN KEY ("senderRecruiterId") REFERENCES "CompanyRecruiter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_receiverJobSeekerId_fkey" FOREIGN KEY ("receiverJobSeekerId") REFERENCES "JobSeeker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_receiverRecruiterId_fkey" FOREIGN KEY ("receiverRecruiterId") REFERENCES "CompanyRecruiter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
