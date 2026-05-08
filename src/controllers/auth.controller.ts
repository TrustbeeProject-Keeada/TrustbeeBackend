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
} from "../services/auth.service.js";

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
    const jobSeeker = await logInJobSeekerService(data);

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
    const companyRecruiter = await logInCompanyRecruiterService(data);

    res.status(200).json({
      status: "Company recruiter logged in successfully",
      companyRecruiter: companyRecruiter,
    });
  } catch (error) {
    next(error);
  }
};
