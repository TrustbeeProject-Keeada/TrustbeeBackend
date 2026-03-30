import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app.error.js";
import { MatchMakingService } from "../services/ai.service.js";

export const MatchMakingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const jobAddId = req.body.jobAddId;
    const jobseekerId = req.body.jobseekerId;

    if (!jobseekerId || !jobAddId) {
      return next(
        new AppError("Job Seeker ID and Job Add ID are required", 400),
      );
    }

    const applications = await MatchMakingService(jobAddId, jobseekerId);
    res.status(200).json({ status: "success", data: applications });
  } catch (error) {
    next(error);
  }
};
