import {
  RegisterJobSeekerTypeZ,
  LogInJobSeekerTypeZ,
} from "../models/jobseeker.model.js";
import bcrypt from "bcrypt";
import { prisma } from "../config/db.js";
import { AppError } from "../utils/app.error.js";

export const registerJobSeekerService = async (
  data: RegisterJobSeekerTypeZ,
) => {
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
      firstName: data.firstname,
      lastName: data.lastname,
      email: data.email,
      password: hashedPassword,
    },
  });
};

export const logInJobSeekerService = async (data: LogInJobSeekerTypeZ) => {
  // compare the passed in email with the one in the database
  const jobSeeker = await prisma.jobSeeker.findUnique({
    where: { email: data.email },
  });

  if (!jobSeeker) {
    throw new AppError("Invalid email or password", 401);
  }

  // compare the passed in password with the one in the database
  const isPasswordValid = await bcrypt.compare(
    data.password,
    jobSeeker.password, // finds the password assigned to the email and compares it with the passed in password
  );

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  return jobSeeker;
};
