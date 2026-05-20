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
import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";
import { sendPasswordResetMail } from "../utils/mailer.js";

export const registerJobSeekerService = async (
  data: RegisterJobSeekerTypeZ,
) => {
  const existingJobSeeker = await prisma.jobSeeker.findUnique({
    where: { email: data.email },
  });

  if (existingJobSeeker) {
    throw new AppError("Job seeker with that email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const createdJobSeeker = await prisma.jobSeeker.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: hashedPassword,
      ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
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
      firstName: jobSeeker.firstName,
    },
    jwtSecret,
    {
      expiresIn,
    },
  );

  const { password, cv, profilePicture, ...jobSeekerExcludingPassword } =
    jobSeeker;

  let cvBase64: string | null = null;
  if (cv) {
    const base64Content = Buffer.from(cv).toString("base64");
    cvBase64 = `data:application/pdf;base64,${base64Content}`;
  }

  let profilePictureBase64: string | null = null;
  if (profilePicture) {
    const base64Content = Buffer.from(profilePicture).toString("base64");
    profilePictureBase64 = `data:image/jpeg;base64,${base64Content}`;
  }

  return {
    ...jobSeekerExcludingPassword,
    cv: cvBase64,
    profilePicture: profilePictureBase64,
    token,
  };
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

  const hashedPassword = await bcrypt.hash(data.password, 12);

  return prisma.companyRecruiter.create({
    data: {
      email: data.email,
      password: hashedPassword,
      companyName: data.companyName,
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
  const companyRecruiter = await prisma.companyRecruiter.findUnique({
    where: { email: data.email },
  });

  if (!companyRecruiter) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(
    data.password,
    companyRecruiter.password,
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
      id: companyRecruiter.id,
      email: companyRecruiter.email,
      role: companyRecruiter.role,
    },
    jwtSecret,
    {
      expiresIn,
    },
  );

  const { password, ...companyRecruiterExcludingPassword } = companyRecruiter;
  return { ...companyRecruiterExcludingPassword, token };
};

// ── Password reset ─────────────────────────────────────────────────────────
// Token is signed with JWT_SECRET + the user's current password hash.
// This makes the token single-use: once the password changes the hash changes
// and any outstanding token is instantly invalid — no extra DB columns needed.

export const forgotPasswordService = async (email: string) => {
  const jwtSecret = process.env.JWT_SECRET!;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";

  // Check job seekers first, then recruiters
  const jobSeeker = await prisma.jobSeeker.findUnique({ where: { email } });
  if (jobSeeker) {
    const secret = jwtSecret + jobSeeker.password;
    const token = jwt.sign(
      { id: jobSeeker.id, email, role: "JOB_SEEKER" },
      secret,
      { expiresIn: "1h" },
    );
    const resetUrl = `${frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}&role=JOB_SEEKER`;
    await sendPasswordResetMail({ to: email, resetUrl });
    return;
  }

  const recruiter = await prisma.companyRecruiter.findUnique({
    where: { email },
  });
  if (recruiter) {
    const secret = jwtSecret + recruiter.password;
    const token = jwt.sign(
      { id: recruiter.id, email, role: "COMPANY_RECRUITER" },
      secret,
      { expiresIn: "1h" },
    );
    const resetUrl = `${frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}&role=COMPANY_RECRUITER`;
    await sendPasswordResetMail({ to: email, resetUrl });
    return;
  }

  // Don't reveal whether the email exists — silently succeed
};

export const resetPasswordService = async (data: {
  token: string;
  email: string;
  role: string;
  newPassword: string;
}) => {
  const jwtSecret = process.env.JWT_SECRET!;

  if (data.role === "COMPANY_RECRUITER") {
    const recruiter = await prisma.companyRecruiter.findUnique({
      where: { email: data.email },
    });
    if (!recruiter) throw new AppError("Invalid or expired reset link.", 400);

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(data.token, jwtSecret + recruiter.password) as JwtPayload;
    } catch {
      throw new AppError("Invalid or expired reset link.", 400);
    }

    if (decoded.email !== data.email)
      throw new AppError("Invalid or expired reset link.", 400);

    const hashedPassword = await bcrypt.hash(data.newPassword, 12);
    await prisma.companyRecruiter.update({
      where: { id: recruiter.id },
      data: { password: hashedPassword },
    });
    return;
  }

  // Default: JOB_SEEKER
  const jobSeeker = await prisma.jobSeeker.findUnique({
    where: { email: data.email },
  });
  if (!jobSeeker) throw new AppError("Invalid or expired reset link.", 400);

  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(data.token, jwtSecret + jobSeeker.password) as JwtPayload;
  } catch {
    throw new AppError("Invalid or expired reset link.", 400);
  }

  if (decoded.email !== data.email)
    throw new AppError("Invalid or expired reset link.", 400);

  const hashedPassword = await bcrypt.hash(data.newPassword, 12);
  await prisma.jobSeeker.update({
    where: { id: jobSeeker.id },
    data: { password: hashedPassword },
  });
};
