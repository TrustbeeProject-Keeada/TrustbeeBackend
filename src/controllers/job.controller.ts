import type { Request, Response, NextFunction } from "express";
import {
  getAllJobsService,
  getJobByIdService,
  createJobService,
  updateJobByIdService,
  deleteJobByIdService,
} from "../services/job.service.js";

export const getAllJobs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const jobs = await getAllJobsService();
    res.status(200).json(jobs);
  } catch (error) {
    next(error);
  }
};

export const getJobById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const idInt = Number(id);
    const job = await getJobByIdService(idInt);
    res.status(200).json(job);
  } catch (error) {
    next(error);
  }
};

export const createJob = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = req.body;
    const user = req.user; // Access the user object set by the auth middleware
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const newJob = await createJobService(data, user.id);
    res.status(201).json(newJob);
  } catch (error) {
    next(error);
  }
};

export const updateJobById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const idInt = Number(id);
    const data = req.body;
    const user = req.user; // Access the user object set by the auth middleware
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const updatedJob = await updateJobByIdService(idInt, data, user.id);
    res.status(200).json(updatedJob);
  } catch (error) {
    next(error);
  }
};

export const deleteJobById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const idInt = Number(id);
    const user = req.user; // Access the user object set by the auth middleware
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // Implementation for deleting job goes here
    const deleteJob = await deleteJobByIdService(idInt);
    res
      .status(200)
      .json({ status: `Job with id ${id} deleted successfully`, deleteJob });
  } catch (error) {
    next(error);
  }
};
