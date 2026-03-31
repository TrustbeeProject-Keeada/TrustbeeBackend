import bcrypt from "bcrypt";
import { prisma } from "../config/db.js";
import { AppError } from "../utils/app.error.js";
import { UpdateJobSeekerTypeZ } from "../models/jobseeker.model.js";
import { Prisma } from "../generated/prisma/index.js";

export const getAllJobSeekersService = async (
  queryFilters?: {
    search?: string;
    city?: string;
    skills?: string;
  },
  pagination?: { page: number; limit: number },
) => {
  const whereClause: Prisma.JobSeekerWhereInput = {};

  if (queryFilters?.search) {
    whereClause.OR = [
      { firstName: { contains: queryFilters.search, mode: "insensitive" } },
      { lastName: { contains: queryFilters.search, mode: "insensitive" } },
      { bio: { contains: queryFilters.search, mode: "insensitive" } },
    ];
  }

  if (queryFilters?.city) {
    whereClause.city = { equals: queryFilters.city, mode: "insensitive" };
  }

  if (queryFilters?.skills) {
    whereClause.skills = {
      has: queryFilters.skills,
    };
  }

  const page = pagination?.page || 1;
  const limit = pagination?.limit || 10;
  const skip = (page - 1) * limit;

  const jobSeekers = await prisma.jobSeeker.findMany({
    where: whereClause,
    skip: skip,
    take: limit,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profilePicture: true,
      city: true,
      languages: true,
      skills: true,
      bio: true,
      portfolioLink: true,
    },
  });

  if (!jobSeekers) {
    throw new AppError("No job seekers found", 404);
  }

  const totalJobSeekers = await prisma.jobSeeker.count({ where: whereClause });

  return {
    jobSeekers,
    meta: {
      totalJobSeekers,
      currentPage: page,
      totalPages: Math.ceil(totalJobSeekers / limit),
    },
  };
};

export const getJobSeekerByIdService = async (id: number) => {
  const jobSeeker = await prisma.jobSeeker.findUnique({
    where: { id: id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profilePicture: true,
      city: true,
      languages: true,
      skills: true,
      bio: true,
      portfolioLink: true,
      cv: true,
    },
  });
  if (!jobSeeker) {
    throw new AppError(`Job seeker with id ${id} not found`, 404);
  }

  let cvBase64: string | null = null;

  if (jobSeeker.cv) {
    const base64Content = Buffer.from(jobSeeker.cv).toString("base64");

    cvBase64 = `data:application/pdf;base64,${base64Content}`;
  }
  return { ...jobSeeker, cv: cvBase64 };
};

export const updateJobSeekerByIdService = async (
  jobseekerId: number,
  data: UpdateJobSeekerTypeZ,
) => {
  const cvBuffer = data.cv
    ? Buffer.from(data.cv.split(",")[1] || data.cv, "base64")
    : undefined;

  const existingJobSeeker = await prisma.jobSeeker.findUnique({
    where: { id: jobseekerId },
  });

  if (!existingJobSeeker) {
    throw new AppError(`Job seeker with id ${jobseekerId} not found`, 404);
  }

  const hashedPassword = data.password
    ? await bcrypt.hash(data.password, 12)
    : undefined;

  const updatedJobSeeker = await prisma.jobSeeker.update({
    where: { id: jobseekerId },
    data: {
      firstName: data.firstname,
      lastName: data.lastname,
      email: data.email,
      password: hashedPassword,
      cv: cvBuffer,
      personalStatement: data.personalStatement,
    },
  });
  return updatedJobSeeker;
};

export const deleteJobSeekerByIdService = async (jobseekerId: number) => {
  const existingJobSeeker = await prisma.jobSeeker.findUnique({
    where: { id: jobseekerId },
  });

  if (!existingJobSeeker) {
    throw new AppError(`Job seeker with id ${jobseekerId} not found`, 404);
  }

  const deletedJobSeeker = await prisma.jobSeeker.delete({
    where: { id: jobseekerId },
  });

  return deletedJobSeeker;
};

export const getJobSeekerDashboardService = async (jobseekerId: number) => {
  const jobseeker = await prisma.jobSeeker.findUnique({
    where: { id: jobseekerId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      accountCompletionRate: true,
      _count: {
        select: {
          applications: true,
          savedJobs: true,
        },
      },
    },
  });

  if (!jobseeker) {
    throw new AppError(`Job seeker with id ${jobseekerId} not found`, 404);
  }

  return {
    jobseekerId: jobseeker.id,
    firstName: jobseeker.firstName,
    lastName: jobseeker.lastName,
    email: jobseeker.email,
    profileStatus: {
      completionRate: jobseeker.accountCompletionRate,
      isProfileComplete: jobseeker.accountCompletionRate === 100,
    },
    statistics: {
      applicationsCount: jobseeker._count.applications,
      savedJobsCount: jobseeker._count.savedJobs,
    },
  };
};
