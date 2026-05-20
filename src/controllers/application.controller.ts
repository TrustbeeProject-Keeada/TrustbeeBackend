import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app.error.js";
import {
  applyForJobService,
  getJobApplicationsService,
  updateApplicationStatusService,
  applyOnWebsiteService,
  getMyApplicationsService,
} from "../services/application.service.js";

export const applyForJob = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const jobId = Number(req.params.jobId);
    const userId = req.user?.id;

    if (!userId) return next(new AppError("Unauthorized", 401));

    const application = await applyForJobService(userId, jobId);
    res.status(201).json({ status: "success", data: application });
  } catch (error) {
    next(error);
  }
};

export const getJobApplications = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const jobId = Number(req.params.jobId);
    const recruiterId = req.user?.id;

    if (!recruiterId) return next(new AppError("Unauthorized", 401));

    const applications = await getJobApplicationsService(jobId, recruiterId);
    res.status(200).json({ status: "success", data: applications });
  } catch (error) {
    next(error);
  }
};

export const updateApplicationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const applicationId = Number(req.params.id);
    const recruiterId = req.user?.id;

    if (!recruiterId) return next(new AppError("Unauthorized", 401));

    const updatedApplication = await updateApplicationStatusService(
      applicationId,
      recruiterId,
      req.body,
    );
    res.status(200).json({ status: "success", data: updatedApplication });
  } catch (error) {
    next(error);
  }
};

export const getMyApplications = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError("Unauthorized", 401));
    const applications = await getMyApplicationsService(userId);
    res.status(200).json({ status: "success", data: applications });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// APPLY ON WEBSITE (Arbetsförmedlingen API)
// ==========================================

/**
 * Handle "Apply on Website" button click for job bank jobs
 * Silently:
 * 1. Finds or creates recruiter account
 * 2. Establishes chat connection
 * 3. Sends recruiter notification
 * 4. Returns success (no errors shown to user)
 */
export const applyOnWebsite = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const jobBankId = req.params.jobBankId as string;
    const userId = req.user?.id;
    const firstName = req.user?.firstName;

    if (!userId) return next(new AppError("Unauthorized", 401));
    if (!jobBankId) return next(new AppError("Job ID is required", 400));

    const result = await applyOnWebsiteService(
      userId,
      jobBankId,
      firstName || "Candidate",
    );

    // Always return 200 success - no errors to user
    res.status(200).json(result);
  } catch (error) {
    // Even if there's an error, return success to avoid breaking user experience
    res.status(200).json({
      status: "success",
      message: "Application initiated successfully",
    });
  }
};
