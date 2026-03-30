import type { Request, Response, NextFunction } from "express";
import {
  getAllJobsService,
  getJobByIdService,
  createJobService,
  updateJobByIdService,
  deleteJobByIdService,
  changeJobStatusService,
  getJobBankService,
} from "../services/job.service.js";

export const getAllJobs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const search = req.query.search as string | undefined;
    const status = req.query.status as "ACTIVE" | "ARCHIVED" | undefined;
    const companyId = req.query.companyId
      ? Number(req.query.companyId)
      : undefined;
    const city = req.query.city as string | undefined;
    const country = req.query.country as string | undefined;
    const category = req.query.category as string | undefined;

    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const jobs = await getAllJobsService(
      {
        search,
        status,
        companyId,
        city,
        country,
        category,
      },
      {
        page,
        limit,
      },
    );
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

    if (!Number.isInteger(idInt) || idInt <= 0) {
      return res.status(400).json({ message: "Invalid job id" });
    }

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
    res.status(200).json({ status: "success", data: updatedJob });
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
    const deleteJob = await deleteJobByIdService(idInt, user.id);
    res
      .status(200)
      .json({ status: `Job with id ${id} deleted successfully`, deleteJob });
  } catch (error) {
    next(error);
  }
};

export const changeJobStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const idInt = Number(id);
    const { status } = req.body;
    const user = req.user; // Access the user object set by the auth middleware

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const updatedJob = await changeJobStatusService(idInt, user.id, status);
    res.status(200).json({
      status: "success",
      message: "Job status updated successfully",
      data: updatedJob,
    });
  } catch (error) {
    next(error);
  }
};

export const getJobBank = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const status = (req.query.status as string) || "ACTIVE";
    const search =
      (req.query.search as string) || (req.query.q as string) || "";
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 100;

    const jobs = await getJobBankService(
      { status },
      { page, limit },
      { search },
    );
    res.status(200).json(jobs);
  } catch (error) {
    next(error);
  }
};
