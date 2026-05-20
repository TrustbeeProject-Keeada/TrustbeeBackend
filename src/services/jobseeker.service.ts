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
      country: true,
      languages: true,
      skills: true,
      bio: true,
      portfolioLink: true,
    },
  });

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
      email: true,
      phoneNumber: true,
      profilePicture: true,
      city: true,
      country: true,
      languages: true,
      skills: true,
      bio: true,
      portfolioLink: true,
      cv: true,
      personalStatement: true,
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

  let profilePictureBase64: string | null = null;
  if (jobSeeker.profilePicture) {
    const base64Content = Buffer.from(jobSeeker.profilePicture).toString(
      "base64",
    );
    profilePictureBase64 = `data:image/jpeg;base64,${base64Content}`;
  }

  return {
    ...jobSeeker,
    cv: cvBase64,
    profilePicture: profilePictureBase64,
  };
};

const MAX_CV_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_PICTURE_BYTES = 2 * 1024 * 1024; // 2 MB

function base64ByteSize(b64: string): number {
  // Base64 encodes 3 bytes as 4 chars; padding '=' doesn't add data
  const base = b64.length * 0.75;
  const padding = (b64.match(/=+$/) || [""])[0].length;
  return Math.floor(base - padding);
}

export const updateJobSeekerByIdService = async (
  jobseekerId: number,
  data: UpdateJobSeekerTypeZ,
) => {
  if (data.cv) {
    const raw = data.cv.split(",")[1] || data.cv;
    if (base64ByteSize(raw) > MAX_CV_BYTES)
      throw new AppError("CV file too large. Maximum size is 5 MB.", 413);
  }

  if (data.profilePicture) {
    const raw = data.profilePicture.split(",")[1] || data.profilePicture;
    if (base64ByteSize(raw) > MAX_PICTURE_BYTES)
      throw new AppError(
        "Profile picture too large. Maximum size is 2 MB.",
        413,
      );
  }

  const cvBuffer = data.cv
    ? Buffer.from(data.cv.split(",")[1] || data.cv, "base64")
    : undefined;

  const profilePictureBuffer = data.profilePicture
    ? Buffer.from(
        data.profilePicture.split(",")[1] || data.profilePicture,
        "base64",
      )
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
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: hashedPassword,
      phoneNumber: data.phoneNumber,
      city: data.city,
      country: data.country,
      bio: data.bio,
      portfolioLink: data.portfolioLink,
      languages: data.languages,
      skills: data.skills,
      cv: cvBuffer,
      personalStatement: data.personalStatement,
      profilePicture: profilePictureBuffer,
    },
  });

  let cvBase64: string | null = null;
  if (updatedJobSeeker.cv) {
    const base64Content = Buffer.from(updatedJobSeeker.cv).toString("base64");
    cvBase64 = `data:application/pdf;base64,${base64Content}`;
  }

  let profilePictureBase64: string | null = null;
  if (updatedJobSeeker.profilePicture) {
    const base64Content = Buffer.from(updatedJobSeeker.profilePicture).toString(
      "base64",
    );
    profilePictureBase64 = `data:image/jpeg;base64,${base64Content}`;
  }

  return {
    ...updatedJobSeeker,
    cv: cvBase64,
    profilePicture: profilePictureBase64,
  };
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
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
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
