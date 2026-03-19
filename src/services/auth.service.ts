import { CreateJobSeekerTypeZ } from "../models/jobseeker.model.js";
import bcrypt from "bcrypt";
import { prisma } from "../config/db.js";
import { AppError } from "../utils/app.error.js";

export const registerJobSeekerService = async (data: CreateJobSeekerTypeZ) => {
  const existingJobSeeker = await prisma.jobSeeker.findUnique({
    where: { email: data.email },
  });

  if (existingJobSeeker) {
    throw new AppError("Job seeker with that email already exists", 409);
  }

  // encrypt the password
  const hashedPassword = await bcrypt.hash(data.password, 12);

  return prisma.jobSeeker.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: hashedPassword,
    },
  });
};
