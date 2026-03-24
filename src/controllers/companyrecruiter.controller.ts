import type { Request, Response, NextFunction } from "express";
import {
  GetAllCompanyRecruitersService,
  GetCompanyRecruiterByIdService,
  UpdateCompanyRecruiterByIdService,
  DeleteCompanyRecruiterByIdService,
} from "../services/companyrecruiter.service.js";

// ! CRUD operations for job recruiter

// ? Get all job recruiters
export const GetCompanyRecruiters = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const companyRecruiters = await GetAllCompanyRecruitersService();
    if (!companyRecruiters) {
      return res.status(404).json({ status: "No company recruiters found" });
    }
    res.status(200).json(companyRecruiters);
  } catch (error) {
    next(error);
  }
};

// ? Get a single job recruiter by ID
export const GetCompanyRecruitersById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const idInt = Number(id);
    const companyRecruiter = await GetCompanyRecruiterByIdService(idInt);
    if (!companyRecruiter) {
      return res
        .status(404)
        .json({ status: `Company recruiter with id ${id} not found` });
    }
    res.status(200).json(companyRecruiter);
  } catch (error) {
    next(error);
  }
};

// ? Update job recruiter  details by ID
export const UpdateCompanyRecruiterById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const idInt = Number(id);
    const updateData = req.body;

    if (req.user?.id !== idInt && req.user?.role !== "ADMIN") {
      return res.status(403).json({
        message: "Forbidden: You can only update your own profile",
      });
    }
    const updatedCompanyRecruiter = await UpdateCompanyRecruiterByIdService(
      idInt,
      updateData,
    );
    if (!updatedCompanyRecruiter) {
      return res
        .status(404)
        .json({ status: `Company recruiter with id ${id} not found` });
    }

    res.status(200).json(updatedCompanyRecruiter);
  } catch (error) {
    next(error);
  }
};

// ? Delete job recruiter account by ID
export const DeleteCompanyRecruiterById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const idInt = Number(id);

    if (req.user?.id !== idInt && req.user?.role !== "ADMIN") {
      return res.status(403).json({
        message: "Forbidden: You can only update your own profile",
      });
    }
    const deletedCompanyRecruiter =
      await DeleteCompanyRecruiterByIdService(idInt);
    if (!deletedCompanyRecruiter) {
      return res
        .status(404)
        .json({ status: `Company recruiter with id ${id} not found` });
    }
    res.status(200).json(deletedCompanyRecruiter);
  } catch (error) {
    next(error);
  }
};
