import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app.error.js";
import {
  applyForJobService,
  getJobApplicationsService,
  updateApplicationStatusService,
} from "../services/application.services.js";

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
