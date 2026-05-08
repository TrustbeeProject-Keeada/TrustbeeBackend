import { prisma } from "../config/db.js";
import { AppError } from "../utils/app.error.js";
import { getBankJobByIdService } from "./job.service.js";

export const saveJobService = async (
  jobSeekerId: number,
  jobIdParam: string,
  source?: "database" | "jobbank",
) => {
  const jobSource = source === "jobbank" ? "jobbank" : "database";

  if (!jobIdParam) {
    throw new AppError(
      "Invalid ID. The job you are trying to save could not be found.",
      400,
    );
  }

  const canTreatAsNumber = !isNaN(Number(jobIdParam));

  if (source === "database" || (!source && canTreatAsNumber)) {
    const jobId = Number(jobIdParam);
    if (!jobId || isNaN(jobId)) {
      throw new AppError(
        "Invalid ID. The job you are trying to save could not be found.",
        400,
      );
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (job) {
      const existing = await prisma.savedJob.findUnique({
        where: { jobSeekerId_jobId: { jobSeekerId, jobId } },
      });

      if (existing) {
        throw new AppError("You have already saved this job.", 400);
      }

      return await prisma.savedJob.create({
        data: { jobSeekerId, jobId, job_source: "database" },
      });
    }

    if (source === "database") {
      throw new AppError(
        "The job you are trying to save could not be found.",
        404,
      );
    }
  }

  // Job bank source (explicit or fallback)
  const jobBankId = jobIdParam;

  try {
    await getBankJobByIdService(jobBankId);
  } catch (error) {
    throw new AppError(
      "The job you are trying to save could not be found.",
      404,
    );
  }

  const existing = await prisma.savedJob.findUnique({
    where: { jobSeekerId_job_bank_id: { jobSeekerId, job_bank_id: jobBankId } },
  });

  if (existing) {
    throw new AppError("You have already saved this job.", 400);
  }

  return await prisma.savedJob.create({
    data: {
      jobSeekerId,
      job_bank_id: jobBankId,
      job_source: "jobbank",
    },
  });
};

export const unsaveJobService = async (
  jobSeekerId: number,
  jobIdParam: string,
  source?: "database" | "jobbank",
) => {
  if (!jobIdParam) {
    throw new AppError("Invalid ID. We could not remove the job.", 400);
  }

  const canTreatAsNumber = !isNaN(Number(jobIdParam));

  if (source === "database" || (!source && canTreatAsNumber)) {
    const jobId = Number(jobIdParam);
    if (!jobId || isNaN(jobId)) {
      throw new AppError("Invalid ID. We could not remove the job.", 400);
    }

    const jobExists = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!jobExists) {
      throw new AppError("Job with this ID does not exist.", 404);
    }

    const existing = await prisma.savedJob.findUnique({
      where: { jobSeekerId_jobId: { jobSeekerId, jobId } },
    });

    if (!existing) {
      throw new AppError("This job is not saved.", 404);
    }

    return await prisma.savedJob.delete({
      where: { jobSeekerId_jobId: { jobSeekerId, jobId } },
    });
  }

  const jobBankId = jobIdParam;

  const existing = await prisma.savedJob.findUnique({
    where: { jobSeekerId_job_bank_id: { jobSeekerId, job_bank_id: jobBankId } },
  });

  if (!existing) {
    throw new AppError("This job is not saved.", 404);
  }

  return await prisma.savedJob.delete({
    where: { jobSeekerId_job_bank_id: { jobSeekerId, job_bank_id: jobBankId } },
  });
};

export const getSavedJobsService = async (jobSeekerId: number) => {
  const savedJobs = await prisma.savedJob.findMany({
    where: { jobSeekerId },
    include: {
      job: {
        include: { company: { select: { companyName: true, logoUrl: true } } },
      },
    },
    orderBy: { savedAt: "desc" },
  });

  return await Promise.all(
    savedJobs.map(async (savedJob) => {
      const jobSource = savedJob.job_source || "database";

      if (jobSource === "jobbank" && savedJob.job_bank_id) {
        try {
          const bankJob = await getBankJobByIdService(savedJob.job_bank_id);
          return {
            ...savedJob,
            job: bankJob,
            job_source: jobSource,
          };
        } catch (error) {
          return {
            ...savedJob,
            job: null,
            job_source: jobSource,
          };
        }
      }

      return {
        ...savedJob,
        job_source: jobSource,
      };
    }),
  );
};

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

  const company = await prisma.companyRecruiter.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new AppError("Company with this ID does not exist.", 404);
  }

  const existing = await prisma.savedCompany.findUnique({
    where: { jobSeekerId_companyId: { jobSeekerId, companyId } },
  });

  if (!existing) {
    throw new AppError("This company is not saved.", 404);
  }

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
