import bcrypt from "bcrypt";
import { prisma } from "../config/db.js";
import { AppError } from "../utils/app.error.js";
import { UpdateJobSeekerTypeZ } from "../models/jobseeker.model.js";

export const getAllJobSeekersService = async () => {
  const jobseekers = await prisma.jobSeeker.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  if (!jobseekers) {
    throw new AppError("No job seekers found", 404);
  }

  return jobseekers;
};

export const getJobSeekerByIdService = async (id: number) => {
  const jobseeker = await prisma.jobSeeker.findUnique({
    where: { id: id },
  });
  if (!jobseeker) {
    throw new AppError(`Job seeker with id ${id} not found`, 404);
  }
  return jobseeker;
};

export const updateJobSeekerByIdService = async (
  jobseekerId: number,
  data: UpdateJobSeekerTypeZ,
) => {
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
    },
  });
  if (!updatedJobSeeker) {
    throw new AppError(`Job seeker with id ${jobseekerId} not found`, 404);
  }
  return updatedJobSeeker;
};

export const deleteJobSeekerByIdService = async (jobseekerId: number) => {
  const deletedJobSeeker = await prisma.jobSeeker.delete({
    where: { id: jobseekerId },
  });
  if (!deletedJobSeeker) {
    throw new AppError(`Job seeker with id ${jobseekerId} not found`, 404);
  }
  return deletedJobSeeker;
};
