import type { NextFunction, Request, Response } from "express";
import { RegisterJobSeekerTypeZ } from "../models/jobseeker.model.js";
import {
  registerJobSeekerService,
  logInJobSeekerService,
} from "../services/auth.service.js";
import { RegisterCompanyRecruiterTypeZ } from "../models/companyrecruiter.model.js";
import {
  registerCompanyRecruiterService,
  logInCompanyRecruiterService,
  forgotPasswordService,
  resetPasswordService,
} from "../services/auth.service.js";

const isProd = process.env.NODE_ENV === "production";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  // Cross-origin (Vercel → Render): must be "none" so the browser sends the
  // cookie on cross-site fetch requests. "none" requires secure:true, which is
  // already enforced in production above.
  sameSite: (isProd ? "none" : "lax") as "none" | "lax",
  maxAge: 24 * 60 * 60 * 1000, // 1 day in ms
  path: "/",
};

export const RegisterJobSeeker = async (
  req: Request<{}, {}, RegisterJobSeekerTypeZ>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = req.body;
    const newJobSeeker = await registerJobSeekerService(data);

    res.status(201).json({
      status: "Job seeker created successfully",
      jobseeker: newJobSeeker,
    });
  } catch (error) {
    next(error);
  }
};

export const LogInJobSeeker = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = req.body;
    const { token, ...jobSeeker } = await logInJobSeekerService(data);

    res.cookie("trustbee_token", token, COOKIE_OPTIONS);

    res.status(200).json({
      status: "Job seeker logged in successfully",
      jobseeker: jobSeeker,
    });
  } catch (error) {
    next(error);
  }
};

export const RegisterCompanyRecruiter = async (
  req: Request<{}, {}, RegisterCompanyRecruiterTypeZ>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = req.body;
    const newCompanyRecruiter = await registerCompanyRecruiterService(data);

    res.status(201).json({
      status: "Company recruiter created successfully",
      companyRecruiter: newCompanyRecruiter,
    });
  } catch (error) {
    next(error);
  }
};

export const LogInCompanyRecruiter = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = req.body;
    const { token, ...companyRecruiter } =
      await logInCompanyRecruiterService(data);

    res.cookie("trustbee_token", token, COOKIE_OPTIONS);

    res.status(200).json({
      status: "Company recruiter logged in successfully",
      companyRecruiter,
    });
  } catch (error) {
    next(error);
  }
};

export const Logout = (req: Request, res: Response) => {
  res.clearCookie("trustbee_token", {
    path: "/",
    secure: isProd,
    sameSite: (isProd ? "none" : "lax") as "none" | "lax",
  });
  res.status(200).json({ status: "Logged out successfully" });
};

export const ForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await forgotPasswordService(req.body.email);
    // Always return 200 to avoid revealing whether the email exists
    res.status(200).json({
      message: "If that email is registered, a reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

export const ResetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token, email, role, newPassword } = req.body;
    await resetPasswordService({ token, email, role, newPassword });
    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    next(error);
  }
};
