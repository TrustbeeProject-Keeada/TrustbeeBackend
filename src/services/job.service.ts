import { prisma } from "../config/db.js";
import { AppError } from "../utils/app.error.js";
import { CreateJobTypeZ, UpdateJobTypeZ } from "../models/jobs.model.js";

export const getAllJobsService = async () => {
  const jobs = await prisma.job.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      company: true,
      status: true,
    },
  });

  if (!jobs) {
    throw new AppError("No jobs found", 404);
  }

  return jobs;
};

export const getJobByIdService = async (jobId: number) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      title: true,
      description: true,
      company: true,
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
