import { prisma } from "../config/db.js";
import { AppError } from "../utils/app.error.js";

// ==========================================
// BOKMÄRK JOBB
// ==========================================

export const saveJobService = async (jobSeekerId: number, jobId: number) => {
  if (!jobId || isNaN(jobId)) {
    throw new AppError(
      "Ogiltigt ID. Jobbet du försöker spara verkar inte finnas.",
      400,
    );
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    throw new AppError(
      "Jobbet du försöker spara finns tyvärr inte längre.",
      404,
    );
  }

  const existing = await prisma.savedJob.findUnique({
    where: { jobSeekerId_jobId: { jobSeekerId, jobId } },
  });

  if (existing) {
    throw new AppError("Du har redan sparat detta jobb", 400);
  }

  return await prisma.savedJob.create({ data: { jobSeekerId, jobId } });
};

export const unsaveJobService = async (jobSeekerId: number, jobId: number) => {
  if (!jobId || isNaN(jobId)) {
    throw new AppError("Ogiltigt ID. Vi kunde inte ta bort jobbet.", 400);
  }

  const existing = await prisma.savedJob.findUnique({
    where: { jobSeekerId_jobId: { jobSeekerId, jobId } },
  });

  if (!existing) {
    throw new AppError("Detta jobb är inte sparat sedan tidigare.", 404);
  }

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
      "Ogiltigt ID. Företaget du försöker spara verkar inte finnas.",
      400,
    );
  }

  const company = await prisma.companyRecruiter.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new AppError("Företaget hittades inte.", 404);
  }

  const existing = await prisma.savedCompany.findUnique({
    where: { jobSeekerId_companyId: { jobSeekerId, companyId } },
  });

  if (existing) {
    throw new AppError("Du har redan sparat detta företag.", 400);
  }

  return await prisma.savedCompany.create({ data: { jobSeekerId, companyId } });
};

export const unsaveCompanyService = async (
  jobSeekerId: number,
  companyId: number,
) => {
  if (!companyId || isNaN(companyId)) {
    throw new AppError("Ogiltigt ID. Vi kunde inte ta bort företaget.", 400);
  }

  const existing = await prisma.savedCompany.findUnique({
    where: { jobSeekerId_companyId: { jobSeekerId, companyId } },
  });

  if (!existing) {
    throw new AppError("Detta företag är inte sparat sedan tidigare.", 404);
  }

  return await prisma.savedCompany.delete({
    where: { jobSeekerId_companyId: { jobSeekerId, companyId } },
  });
};

export const getSavedCompaniesService = async (jobSeekerId: number) => {
  if (!jobSeekerId || isNaN(jobSeekerId)) {
    throw new AppError(
      "Ogiltigt användar-ID. Vi kunde inte hämta dina sparade företag.",
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
