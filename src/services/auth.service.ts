import {
  RegisterJobSeekerTypeZ,
  LogInJobSeekerTypeZ,
} from "../models/jobseeker.model.js";
import bcrypt from "bcrypt";
import { prisma } from "../config/db.js";
import { AppError } from "../utils/app.error.js";
import {
  LoginCompanyRecruiterTypeZ,
  RegisterCompanyRecruiterTypeZ,
} from "../models/companyrecruiter.model.js";
import jwt, { SignOptions } from "jsonwebtoken";

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

  const createdJobSeeker = await prisma.jobSeeker.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: hashedPassword,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  return createdJobSeeker;
};
export const logInJobSeekerService = async (data: LogInJobSeekerTypeZ) => {
  const jobSeeker = await prisma.jobSeeker.findUnique({
    where: { email: data.email },
  });

  if (!jobSeeker) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(
    data.password,
    jobSeeker.password,
  );

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new AppError("JWT_SECRET not set", 500);
  }

  const expiresIn = (process.env.JWT_EXPIRES_IN ??
    "1d") as SignOptions["expiresIn"];

  const token = jwt.sign(
    {
      id: jobSeeker.id,
      email: jobSeeker.email,
      role: jobSeeker.role,
    },
    jwtSecret,
    {
      expiresIn,
    },
  );

  const { password, ...jobSeekerExcludingPassword } = jobSeeker;
  return { ...jobSeekerExcludingPassword, token };
};

export const registerCompanyRecruiterService = async (
  data: RegisterCompanyRecruiterTypeZ,
) => {
  const existingCompanyRecruiter = await prisma.companyRecruiter.findUnique({
    where: { email: data.email },
  });

  if (existingCompanyRecruiter) {
    throw new AppError("Company recruiter with that email already exists", 409);
  }

  // encrypt the password
  const hashedPassword = await bcrypt.hash(data.password, 12);

  return prisma.companyRecruiter.create({
    data: {
      email: data.email,
      companyName: data.companyName,
      password: hashedPassword,
      organizationNumber: data.organizationNumber,
      phoneNumber: data.phoneNumber,
    },
    select: {
      id: true,
      email: true,
      companyName: true,
      organizationNumber: true,
      phoneNumber: true,
    },
  });
};

export const logInCompanyRecruiterService = async (
  data: LoginCompanyRecruiterTypeZ,
) => {
  // compare the passed in email with the one in the database
  const companyRecruiter = await prisma.companyRecruiter.findUnique({
    where: { email: data.email },
  });

  if (!companyRecruiter) {
    throw new AppError("Invalid email or password", 401);
  }

  // compare the passed in password with the one in the database
  const isPasswordValid = await bcrypt.compare(
    data.password,
    companyRecruiter.password, // finds the password assigned to the email and compares it with the passed in password
  );

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  // add jwt token generation here
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new AppError("JWT_SECRET not set", 500);
  }

  const expiresIn = (process.env.JWT_EXPIRES_IN ??
    "1d") as SignOptions["expiresIn"];

  const token = jwt.sign(
    {
      id: companyRecruiter.id,
      email: companyRecruiter.email,
      role: companyRecruiter.role,
    },
    jwtSecret,
    {
      expiresIn,
    },
  );

  const { password, ...companyRecruiterExcludingPassword } = companyRecruiter; // this is to exclude the password from the returned object
  return { ...companyRecruiterExcludingPassword, token };
};
