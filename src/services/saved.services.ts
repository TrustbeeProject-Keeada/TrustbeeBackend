import { prisma } from "../config/db.js";
import { AppError } from "../utils/app.error.js";

// ==========================================
// BOKMÄRK JOBB
// ==========================================

export const saveJobService = async (jobSeekerId: number, jobId: number) => {
  if (!jobId || isNaN(jobId)) {
    throw new AppError(
      "Invalid ID. The job you are trying to save could not be found.",
      400,
    );
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    throw new AppError(
      "The job you are trying to save could not be found.",
      404,
    );
  }

  const existing = await prisma.savedJob.findUnique({
    where: { jobSeekerId_jobId: { jobSeekerId, jobId } },
  });

  if (existing) {
    throw new AppError("You have already saved this job.", 400);
  }

  return await prisma.savedJob.create({ data: { jobSeekerId, jobId } });
};

export const unsaveJobService = async (jobSeekerId: number, jobId: number) => {
  if (!jobId || isNaN(jobId)) {
    throw new AppError("Invalid ID. We could not remove the job.", 400);
  }

  // 1. KOLLA FÖRST: Finns jobbet överhuvudtaget i systemet?
  const jobExists = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!jobExists) {
    throw new AppError("Job with this ID does not exist.", 404);
  }

  // 2. KOLLA SEN: Är jobbet sparat av användaren?
  const existing = await prisma.savedJob.findUnique({
    where: { jobSeekerId_jobId: { jobSeekerId, jobId } },
  });

  if (!existing) {
    throw new AppError("This job is not saved.", 404);
  }

  // 3. RADERA
  return await prisma.savedJob.delete({
    where: { jobSeekerId_jobId: { jobSeekerId, jobId } },
  });
};

export const getSavedJobsService = async (jobSeekerId: number) => {
  return await prisma.savedJob.findMany({
    where: { jobSeekerId },
    include: {
      job: {
        include: { company: { select: { companyName: true, logoUrl: true } } },
      },
    },
    orderBy: { savedAt: "desc" },
  });
};

// ==========================================
// BOKMÄRK FÖRETAG
// ==========================================

export const saveCompanyService = async (
  jobSeekerId: number,
  companyId: number,
) => {
  if (!companyId || isNaN(companyId)) {
    throw new AppError(
      "Invalid ID. The company you are trying to save could not be found.",
      400,
    );
  }

  const company = await prisma.companyRecruiter.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new AppError(
      "The company you are trying to save could not be found.",
      404,
    );
  }

  const existing = await prisma.savedCompany.findUnique({
    where: { jobSeekerId_companyId: { jobSeekerId, companyId } },
  });

  if (existing) {
    throw new AppError("You have already saved this company.", 400);
  }

  return await prisma.savedCompany.create({ data: { jobSeekerId, companyId } });
};

export const unsaveCompanyService = async (
  jobSeekerId: number,
  companyId: number,
) => {
  if (!companyId || isNaN(companyId)) {
    throw new AppError("Invalid ID. We could not remove the company.", 400);
  }

  // 1. KOLLA OM FÖRETAGET ÖVERHUVUDTAGET FINNS
  const company = await prisma.companyRecruiter.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new AppError("Company with this ID does not exist.", 404);
  }

  // 2. KOLLA OM DET ÄR SPARAT
  const existing = await prisma.savedCompany.findUnique({
    where: { jobSeekerId_companyId: { jobSeekerId, companyId } },
  });

  if (!existing) {
    throw new AppError("This company is not saved.", 404);
  }

  // 3. RADERA OM ALLT OVAN STÄMMER
  return await prisma.savedCompany.delete({
    where: { jobSeekerId_companyId: { jobSeekerId, companyId } },
  });
};

export const getSavedCompaniesService = async (jobSeekerId: number) => {
  if (!jobSeekerId || isNaN(jobSeekerId)) {
    throw new AppError(
      "Invalid user ID. We could not fetch your saved companies.",
      400,
    );
  }

  return await prisma.savedCompany.findMany({
    where: { jobSeekerId },
    include: {
      company: {
        select: {
          id: true,
          companyName: true,
          description: true,
          logoUrl: true,
        },
      },
    },
    orderBy: { savedAt: "desc" },
  });
};
