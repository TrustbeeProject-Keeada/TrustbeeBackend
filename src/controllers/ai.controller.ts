import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app.error.js";
import {
  MatchMakingService,
  GenerateCvService,
  GenerateCvPdfService,
  GenerateJobDescriptionService,
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

export const GenerateJobDescriptionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await GenerateJobDescriptionService(req.body);
    res.status(200).json({ status: "success", data: result });
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
    // Accept either a path param jobseekerId (legacy / DB-save flow)
    // or a full request body containing CV/profile data (purely generate-from-request flow).
    const jobseekerIdParam = req.params.jobseekerId
      ? Number(req.params.jobseekerId)
      : undefined;

    const requestData = Object.keys(req.body || {}).length
      ? req.body
      : undefined;

    if (!jobseekerIdParam && !requestData) {
      return next(
        new AppError("Job Seeker ID or request body data is required", 400),
      );
    }

    // If requestData is provided, prefer generating from that. If jobseekerIdParam is provided
    // and requestData is absent, use the DB-backed generation and save behaviour.
    const pdfData = await GenerateCvPdfService(jobseekerIdParam, requestData);
    res.status(200).json({ status: "success", data: pdfData });
  } catch (error) {
    next(error);
  }
};
