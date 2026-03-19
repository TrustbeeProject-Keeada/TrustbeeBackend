import type { NextFunction, Request, Response } from "express";
import { CreateJobSeekerTypeZ } from "../models/jobseeker.model.js";
import { registerJobSeekerService } from "../services/auth.service.js";

export const RegisterJobSeeker = async (
  req: Request<{}, {}, CreateJobSeekerTypeZ>,
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
