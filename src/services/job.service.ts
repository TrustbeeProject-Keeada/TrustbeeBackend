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
      {
        company: {
          companyName: { contains: queryFilters.search, mode: "insensitive" },
        },
      },
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
      webpage_url: true,
      country: true,
      city: true,
      category: true,
      status: true,
      expiresAt: true,
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
    orderBy: {
      createdAt: "desc",
    },
  });

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
      webpage_url: true,
      country: true,
      city: true,
      category: true,
      status: true,
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
      webpage_url: data.webpage_url,
      country: data.country,
      city: data.city,
      category: data.category,
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

  const updatePayload: Prisma.JobUpdateInput = { ...data };

  if (data.expiresAt) {
    updatePayload.expiresAt = new Date(data.expiresAt);
  }
  return await prisma.job.update({
    where: { id: jobId },
    data: updatePayload,
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
  // const oneMinuteAgo = new Date();
  // oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1); // This is for testing purposes, it will delete jobs that were updated more than 1 minute ago
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

export const archiveExpiredJobsService = async () => {
  const rightNow = new Date();
  const updatedJobs = await prisma.job.updateMany({
    where: {
      expiresAt: {
        lt: rightNow, // This means we want to update jobs that have an expiresAt date that is less than the current date, which means they are expired
      },
      status: "ACTIVE", // We only want to archive jobs that are currently active, we don't want to archive jobs that are already archived
    },
    data: {
      status: "ARCHIVED",
    },
  });
  return updatedJobs;
};

export const getJobBankService = async (
  queryFilters?: {
    status?: string;
  },
  pagination?: {
    page: number;
    limit: number;
  },
  searchFilters?: {
    search?: string;
  },
) => {
  const page = pagination?.page || 1;
  const limit = pagination?.limit || 10;
  const offset = (page - 1) * limit;

  // Build the job bank API URL with pagination and optional filters
  let url = `https://jobsearch.api.jobtechdev.se/search?offset=${offset}&limit=${limit}&q=${encodeURIComponent(searchFilters?.search || "")}`;
  if (queryFilters?.status) {
    // The external API may or may not support a `status` param; append it so callers can request it.
    url += `&status=${encodeURIComponent(queryFilters.status)}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new AppError(
        `Failed to fetch job bank data: ${response.statusText}`,
        response.status,
      );
    }

    const data = await response.json();

    // Normalize job_bank API response to match internal Job model structure
    const mappedJobs = Array.isArray(data.hits)
      ? data.hits.map((hit: any) => ({
          id: hit.id,
          title: hit.headline,
          description: hit.description || "",
          webpage_url: hit.webpage_url,
          country: hit.workplace_address?.country || null,
          city:
            hit.workplace_address?.city ||
            hit.workplace_address?.region ||
            null,
          category: hit.occupation?.label || null,
          status: hit.removed ? "ARCHIVED" : "ACTIVE",
          expiresAt: hit.application_deadline
            ? new Date(hit.application_deadline)
            : null,
          company: {
            id: hit.employer?.id || null,
            companyName:
              hit.employer?.name || hit.employer?.workplace || "Unknown",
            email: null,
            description: null,
            country: hit.workplace_address?.country || null,
            logoUrl: null,
          },
          employmentType: hit.employment_type?.label || null,
          salaryType: hit.salary_type?.label || null,
        }))
      : [];

    const totalJobs = data.total || 0;
    const totalPages = Math.ceil(totalJobs / limit);

    return {
      jobs: mappedJobs,
      meta: {
        totalJobs,
        currentPage: page,
        totalPages,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new AppError(`Error fetching job bank data: ${message}`, 500);
  }
};

export const getBankJobByIdService = async (jobId: number) => {
  try {
    const url = `https://jobsearch.api.jobtechdev.se/ad/${jobId}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new AppError(
        `Failed to fetch job from bank: ${response.statusText}`,
        response.status,
      );
    }

    const hit = await response.json();

    // The /ad/ endpoint returns a single job object directly
    if (!hit || !hit.id) {
      throw new AppError(`Job with id ${jobId} not found in job bank`, 404);
    }

    // Map to normalized structure
    return {
      id: hit.id,
      title: hit.headline,
      description: hit.description || "",
      webpage_url: hit.webpage_url,
      country: hit.workplace_address?.country || null,
      city:
        hit.workplace_address?.city || hit.workplace_address?.region || null,
      category: hit.occupation?.label || null,
      status: hit.removed ? "ARCHIVED" : "ACTIVE",
      expiresAt: hit.application_deadline
        ? new Date(hit.application_deadline)
        : null,
      company: {
        id: hit.employer?.id || null,
        companyName: hit.employer?.name || hit.employer?.workplace || "Unknown",
        email: null,
        description: null,
        country: hit.workplace_address?.country || null,
        logoUrl: null,
      },
      employmentType: hit.employment_type?.label || null,
      salaryType: hit.salary_type?.label || null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new AppError(`Error fetching job from bank: ${message}`, 500);
  }
};
