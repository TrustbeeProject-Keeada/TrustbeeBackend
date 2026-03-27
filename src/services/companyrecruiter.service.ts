import bcrypt from "bcrypt";
import { prisma } from "../config/db.js";
import { AppError } from "../utils/app.error.js";
import { UpdateCompanyRecruiterTypeZ } from "../models/companyrecruiter.model.js";
import { Prisma } from "../generated/prisma/index.js";

// ? Get all company recruiters.
export const GetAllCompanyRecruitersService = async (queryFilters?: {
  search?: string;
  city?: string;
  country?: string;
  industry?: string;
}) => {
  const whereClause: Prisma.CompanyRecruiterWhereInput = {};
  if (queryFilters?.search) {
    whereClause.OR = [
      { companyName: { contains: queryFilters.search, mode: "insensitive" } },
      { description: { contains: queryFilters.search, mode: "insensitive" } },
    ];
  }
  if (queryFilters?.city) {
    whereClause.city = {
      equals: queryFilters.city as string,
      mode: "insensitive",
    };
  }
  if (queryFilters?.country) {
    whereClause.country = {
      equals: queryFilters.country as string,
      mode: "insensitive",
    };
  }
  if (queryFilters?.industry) {
    whereClause.industry = {
      equals: queryFilters.industry as string,
      mode: "insensitive",
    };
  }
  const companyRecruiters = await prisma.companyRecruiter.findMany({
    where: whereClause,
    select: {
      id: true,
      companyName: true,
      email: true,
      description: true,
      country: true,
      city: true,
      industry: true,
      logoUrl: true,
      // You could even include how many active jobs they have!
      _count: {
        select: { jobs: { where: { status: "ACTIVE" } } },
      },
    },
  });
  if (!companyRecruiters) {
    throw new AppError("No company recruiters found", 404);
  }
  return companyRecruiters;
};

// ? Get company recruiter by id.
export const GetCompanyRecruiterByIdService = async (id: number) => {
  const companyRecruiter = await prisma.companyRecruiter.findUnique({
    where: { id: id },
  });
  if (!companyRecruiter) {
    throw new AppError(`Company recruiter with id ${id} not found`, 404);
  }
  return companyRecruiter;
};

// ? Update company recruiter by id.
export const UpdateCompanyRecruiterByIdService = async (
  id: number,
  data: UpdateCompanyRecruiterTypeZ,
) => {
  const hashedPassword = data.password
    ? await bcrypt.hash(data.password, 12)
    : undefined;
  const updatedCompanyRecruiter = await prisma.companyRecruiter.update({
    where: { id: id },
    data: {
      companyName: data.companyname,
      email: data.email,
      phoneNumber: data.phonenumber,
      password: hashedPassword,
      description: data.description,
      logoUrl: data.logourl,
    },
  });
  if (!updatedCompanyRecruiter) {
    throw new AppError(`Company recruiter with id ${id} not found`, 404);
  }
  return updatedCompanyRecruiter;
};

// ? Delete company recruiter by id.
export const DeleteCompanyRecruiterByIdService = async (id: number) => {
  const deletedCompanyRecruiter = await prisma.companyRecruiter.delete({
    where: { id: id },
  });
  if (!deletedCompanyRecruiter) {
    throw new AppError(`Company recruiter with id ${id} not found`, 404);
  }
  return deletedCompanyRecruiter;
};
