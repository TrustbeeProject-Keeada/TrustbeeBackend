import type { NextFunction, Request, Response } from "express";
import { RegisterJobSeekerTypeZ } from "../models/jobseeker.model.js";
import {
  registerJobSeekerService,
  logInJobSeekerService,
} from "../services/auth.service.js";

export const RegisterJobSeeker = async (
  req: Request<{}, {}, RegisterJobSeekerTypeZ>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = req.body;
    const newJobSeeker = await registerJobSeekerService(data);

    if (!newJobSeeker) {
      return res.status(500).json({ status: "Failed to create job seeker" });
    }

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

    if (!jobSeeker) {
      return res.status(401).json({ status: "Invalid email or password" });
    }

    res.status(200).json({
      status: "Job seeker logged in successfully",
      jobseeker: jobSeeker,
    });
  } catch (error) {
    next(error);
  }
};
