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
    },
  });

  if (!jobs) {
    throw new AppError("No jobs found", 404);
  }

  return jobs;
};

export const getJobByIdService = async (id: number) => {
  const job = await prisma.job.findUnique({
    where: { id: id },
    select: {
      id: true,
      title: true,
      description: true,
      company: true,
    },
  });
  if (!job) {
    throw new AppError(`Job with id ${id} not found`, 404);
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
  id: number,
  data: UpdateJobTypeZ,
  companyId: number,
) => {
  const updatedJob = await prisma.job.update({
    where: { id: id },
    data: {
      companyId: companyId,
      title: data.title,
      description: data.description,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    },
  });
  if (!updatedJob) {
    throw new AppError(`Job with id ${id} not found`, 404);
  }
  return updatedJob;
};

export const deleteJobByIdService = async (id: number) => {
  const deletedJob = await prisma.job.delete({
    where: { id: id },
  });
  if (!deletedJob) {
    throw new AppError(`Job with id ${id} not found`, 404);
  }
  return deletedJob;
};
