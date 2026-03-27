import type { NextFunction, Request, Response } from "express";
import {
  deleteJobSeekerByIdService,
  getAllJobSeekersService,
  getJobSeekerByIdService,
  updateJobSeekerByIdService,
  getJobSeekerDashboardService,
} from "../services/jobseeker.service.js";

export const getJobSeekers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const jobseekers = await getAllJobSeekersService();

    if (!jobseekers) {
      return res.status(404).json({ status: "No job seekers found" });
    }

    res.status(200).json(jobseekers);
  } catch (error) {
    next(error);
  }
};

export const getJobSeekerById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const idInt = Number(id);
    const jobseeker = await getJobSeekerByIdService(idInt);

    if (!jobseeker) {
      return res
        .status(404)
        .json({ status: `Job seeker with id ${id} not found` });
    }

    res.status(200).json(jobseeker);
  } catch (error) {
    next(error);
  }
};

export const updateJobSeekerById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const rawId = req.params.id;
    const idString = Array.isArray(rawId) ? rawId[0] : String(rawId);
    const idInt = parseInt(idString, 10);

    const updateData = req.body;

    if (req.user?.id !== idInt && req.user?.role !== "ADMIN") {
      return res.status(403).json({
        message: "Forbidden: You can only update your own profile",
      });
    }

    const updateJobSeeker = await updateJobSeekerByIdService(idInt, updateData);

    res.status(200).json({
      status: `Job seeker with id ${idInt} updated successfully`,
      jobseeker: updateJobSeeker,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteJobSeekerById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const idInt = Number(id);

    if (req.user?.id !== idInt && req.user?.role !== "ADMIN") {
      return res.status(403).json({
        message: "Forbidden: You can only delete your own profile",
      });
    }

    const jobseeker = await deleteJobSeekerByIdService(idInt);

    res.status(200).json({
      status: `Job seeker with id ${id} deleted successfully`,
      jobseeker,
    });
  } catch (error) {
    next(error);
  }
};

export const getJobSeekerDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const idInt = Number(id);

    if (!Number.isInteger(idInt) || idInt <= 0) {
      return res.status(400).json({
        message: "Invalid job seeker id",
      });
    }

    // Check if user is accessing their own dashboard or is admin
    if (req.user?.id !== idInt && req.user?.role !== "ADMIN") {
      return res.status(403).json({
        message: "Forbidden: You can only access your own dashboard",
      });
    }

    const dashboard = await getJobSeekerDashboardService(idInt);

    res.status(200).json({
      status: "Dashboard data retrieved successfully",
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};
