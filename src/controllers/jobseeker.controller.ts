import type { NextFunction, Request, Response } from "express";
import {
  deleteJobSeekerByIdService,
  getAllJobSeekersService,
  getJobSeekerByIdService,
  updateJobSeekerByIdService,
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
    const id = req.params.id as string;
    const idInt = Number(id);
    const updateData = req.body;
    // Implementation for updating job seeker goes here
    const updateJobSeeker = await updateJobSeekerByIdService(idInt, updateData);

    if (!updateJobSeeker) {
      return res
        .status(404)
        .json({ status: `Job seeker with id ${id} not found` });
    }

    res.status(200).json({
      status: `Job seeker with id ${id} updated successfully`,
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
    const jobseeker = await deleteJobSeekerByIdService(idInt);

    if (!jobseeker) {
      return res
        .status(404)
        .json({ status: `Job seeker with id ${id} not found` });
    }

    res.status(200).json({
      status: `Job seeker with id ${id} deleted successfully`,
      jobseeker,
    });
  } catch (error) {
    next(error);
  }
};
