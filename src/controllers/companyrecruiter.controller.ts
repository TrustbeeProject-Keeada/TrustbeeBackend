import type { Request, Response, NextFunction } from "express";
import {
  GetAllCompanyRecruitersService,
  GetCompanyRecruiterByIdService,
  UpdateCompanyRecruiterByIdService,
  DeleteCompanyRecruiterByIdService,
} from "../services/companyrecruiter.service.js";

export const GetCompanyRecruiters = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const search = req.query.search as string | undefined;
    const city = req.query.city as string | undefined;
    const country = req.query.country as string | undefined;
    const industry = req.query.industry as string | undefined;

    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const companyRecruiters = await GetAllCompanyRecruitersService(
      {
        search,
        city,
        country,
        industry,
      },
      { page, limit },
    );

    res.status(200).json({
      status: "success",
      data: companyRecruiters,
    });
  } catch (error) {
    next(error);
  }
};

export const GetCompanyRecruitersById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const idInt = Number(id);
    const companyRecruiter = await GetCompanyRecruiterByIdService(idInt);
    res.status(200).json({
      status: "success",
      data: companyRecruiter,
    });
  } catch (error) {
    next(error);
  }
};

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

    res.status(200).json({
      status: "success",
      data: updatedCompanyRecruiter,
    });
  } catch (error) {
    next(error);
  }
};

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
        message: "Forbidden: You can only delete your own profile",
      });
    }
    const deletedCompanyRecruiter =
      await DeleteCompanyRecruiterByIdService(idInt);

    res.status(200).json({
      status: "success",
      data: deletedCompanyRecruiter,
    });
  } catch (error) {
    next(error);
  }
};
