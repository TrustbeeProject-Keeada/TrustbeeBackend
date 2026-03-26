import { prisma } from "../config/db.js";
import { AppError } from "../utils/app.error.js";

// ==========================================
// BOKMÄRK JOBB
// ==========================================

export const saveJobService = async (jobSeekerId: number, jobId: number) => {
  // Kolla så att jobbet faktiskt finns
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new AppError("Job not found", 404);

  // Kolla så att användaren inte redan har sparat det
  const existing = await prisma.savedJob.findUnique({
    where: { jobSeekerId_jobId: { jobSeekerId, jobId } },
  });
  if (existing) throw new AppError("You have already saved this job", 400);

  // Spara jobbet i databasen
  return await prisma.savedJob.create({ data: { jobSeekerId, jobId } });
};

export const unsaveJobService = async (jobSeekerId: number, jobId: number) => {
  const existing = await prisma.savedJob.findUnique({
    where: { jobSeekerId_jobId: { jobSeekerId, jobId } },
  });
  if (!existing) throw new AppError("Job is not saved", 404);

  // Ta bort sparandet
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
  const company = await prisma.companyRecruiter.findUnique({
    where: { id: companyId },
  });
  if (!company) throw new AppError("Company not found", 404);

  const existing = await prisma.savedCompany.findUnique({
    where: { jobSeekerId_companyId: { jobSeekerId, companyId } },
  });
  if (existing) throw new AppError("You have already saved this company", 400);

  return await prisma.savedCompany.create({ data: { jobSeekerId, companyId } });
};

export const unsaveCompanyService = async (
  jobSeekerId: number,
  companyId: number,
) => {
  const existing = await prisma.savedCompany.findUnique({
    where: { jobSeekerId_companyId: { jobSeekerId, companyId } },
  });
  if (!existing) throw new AppError("Company is not saved", 404);

  return await prisma.savedCompany.delete({
    where: { jobSeekerId_companyId: { jobSeekerId, companyId } },
  });
};

export const getSavedCompaniesService = async (jobSeekerId: number) => {
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
