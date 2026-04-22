import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app.error.js";
import {
  MatchMakingService,
  GenerateCvService,
  GenerateCvPdfService,
} from "../services/ai.service.js";

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

export const GenerateCvController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const jobseekerId = req.params.jobseekerId || req.body.jobseekerId;

    if (!jobseekerId) {
      return next(new AppError("Job Seeker ID is required", 400));
    }

    const cvData = await GenerateCvService(Number(jobseekerId));
    res.status(200).json({ status: "success", data: cvData });
  } catch (error) {
    next(error);
  }
};

export const GenerateCvPdfController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const jobseekerId = req.params.jobseekerId || req.body.jobseekerId;

    if (!jobseekerId) {
      return next(new AppError("Job Seeker ID is required", 400));
    }

    const pdfData = await GenerateCvPdfService(Number(jobseekerId));
    res.status(200).json({ status: "success", data: pdfData });
  } catch (error) {
    next(error);
  }
};
