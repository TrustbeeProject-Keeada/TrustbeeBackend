import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app.error.js";
import {
  saveJobService,
  unsaveJobService,
  getSavedJobsService,
  saveCompanyService,
  unsaveCompanyService,
  getSavedCompaniesService,
} from "../services/saved.services.js";

// ==========================================
// JOBB
// ==========================================

export const saveJob = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const jobId = Number(req.params.jobId);
    const userId = req.user?.id;

    if (!userId) return next(new AppError("Unauthorized", 401));

    await saveJobService(userId, jobId);
    res
      .status(201)
      .json({ status: "success", message: "Job saved successfully" });
  } catch (error) {
    next(error);
  }
};

export const unsaveJob = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const jobId = Number(req.params.jobId);
    const userId = req.user?.id;

    if (!userId) return next(new AppError("Unauthorized", 401));

    await unsaveJobService(userId, jobId);
    res
      .status(200)
      .json({ status: "success", message: "Job removed from saved" });
  } catch (error) {
    next(error);
  }
};

export const getSavedJobs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError("Unauthorized", 401));

    const savedJobs = await getSavedJobsService(userId);
    res.status(200).json({ status: "success", data: savedJobs });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// FÖRETAG
// ==========================================

export const saveCompany = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const companyId = Number(req.params.companyId);
    const userId = req.user?.id;

    if (!userId) return next(new AppError("Unauthorized", 401));

    await saveCompanyService(userId, companyId);
    res
      .status(201)
      .json({ status: "success", message: "Company saved successfully" });
  } catch (error) {
    next(error);
  }
};

export const unsaveCompany = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const companyId = Number(req.params.companyId);
    const userId = req.user?.id;

    if (!userId) return next(new AppError("Unauthorized", 401));

    await unsaveCompanyService(userId, companyId);
    res
      .status(200)
      .json({ status: "success", message: "Company removed from saved" });
  } catch (error) {
    next(error);
  }
};

export const getSavedCompanies = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(new AppError("Unauthorized", 401));

    const savedCompanies = await getSavedCompaniesService(userId);
    res.status(200).json({ status: "success", data: savedCompanies });
  } catch (error) {
    next(error);
  }
};
