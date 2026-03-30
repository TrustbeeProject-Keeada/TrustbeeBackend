import { prisma } from "../config/db.js";
import { AppError } from "../utils/app.error.js";
import { CreateJobTypeZ, UpdateJobTypeZ } from "../models/jobs.model.js";
import { Prisma } from "../generated/prisma/index.js";

export const getAllJobsService = async (
  queryFilters?: {
    search?: string;
    status?: "ACTIVE" | "ARCHIVED";
    companyId?: number;
    city?: string;
    country?: string;
    category?: string;
  },
  pagination?: {
    page: number;
    limit: number;
  },
) => {
  const whereClause: Prisma.JobWhereInput = {};

  if (queryFilters?.search) {
    whereClause.OR = [
      { title: { contains: queryFilters.search, mode: "insensitive" } },
      { description: { contains: queryFilters.search, mode: "insensitive" } },
    ];
  }

  if (queryFilters?.status) {
    whereClause.status = queryFilters.status;
  }

  if (queryFilters?.companyId) {
    whereClause.companyId = queryFilters.companyId;
  }

  if (queryFilters?.city) {
    whereClause.city = { equals: queryFilters.city, mode: "insensitive" };
  }

  if (queryFilters?.country) {
    whereClause.country = { equals: queryFilters.country, mode: "insensitive" };
  }

  if (queryFilters?.category) {
    whereClause.category = {
      equals: queryFilters.category,
      mode: "insensitive",
    };
  }

  const page = pagination?.page || 1;
  const limit = pagination?.limit || 10;
  const skip = (page - 1) * limit;

  const jobs = await prisma.job.findMany({
    where: whereClause,
    skip: skip,
    take: limit,
    select: {
      id: true,
      title: true,
      description: true,
      company: true,
      status: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (jobs.length === 0) {
    throw new AppError("No jobs found", 404);
  }

  const totalJobs = await prisma.job.count({ where: whereClause });

  return {
    jobs,
    meta: {
      totalJobs,
      currentPage: page,
      totalPages: Math.ceil(totalJobs / limit),
    },
  };
};

export const getJobByIdService = async (jobId: number) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      title: true,
      description: true,
      company: {
        select: {
          id: true,
          companyName: true,
          email: true,
          description: true,
          country: true,
          logoUrl: true,
        },
      },
    },
  });
  if (!job) {
    throw new AppError(`Job with id ${jobId} not found`, 404);
  }
  return job;
};

export const createJobService = async (
  data: CreateJobTypeZ,
  companyId: number,
) => {
  const newJob = await prisma.job.create({
    data: {
      companyId: companyId,
      title: data.title,
      description: data.description,
      expiresAt: new Date(data.expiresAt),
    },
  });
  if (!newJob) {
    throw new AppError("Failed to create job", 500);
  }
  return newJob;
};

export const updateJobByIdService = async (
  jobId: number,
  data: UpdateJobTypeZ,
  companyId: number,
) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new AppError("Job not found", 404);
  }

  if (job.companyId !== companyId) {
    throw new AppError("Forbidden", 403);
  }

  return await prisma.job.update({
    where: { id: jobId },
    data,
  });
};

export const deleteJobByIdService = async (
  jobId: number,
  companyId: number,
) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });
  if (!job) {
    throw new AppError(`Job with id ${jobId} not found`, 404);
  }

  if (job.companyId !== companyId) {
    throw new AppError("You are not the owner of this job", 403);
  }

  const deletedJob = await prisma.job.delete({
    where: { id: jobId },
  });
  if (!deletedJob) {
    throw new AppError(`Job with id ${jobId} not found`, 404);
  }
  return deletedJob;
};

export const changeJobStatusService = async (
  jobId: number,
  companyId: number,
  status: "ACTIVE" | "ARCHIVED",
) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new AppError(`Job with id ${jobId} not found`, 404);
  }

  if (job.companyId !== companyId) {
    throw new AppError(`Forbidden: You are not the owner of job ${jobId}`, 403);
  }

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data: { status: status },
  });
  return updatedJob;
};

export const cleanUpOldArchivedJobsService = async () => {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3); // This works by subtracting 3 months from the current date, so it will give us the date that is 3 months ago from now

  const result = await prisma.job.deleteMany({
    where: {
      status: "ARCHIVED",
      updatedAt: {
        lt: threeMonthsAgo, // lt = less than, this means we want to delete jobs that were updated before the date that is 3 months ago from now
      },
    },
  });
  return result;
};
