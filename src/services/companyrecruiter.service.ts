import bcrypt from "bcrypt";
import { prisma } from "../config/db.js";
import { AppError } from "../utils/app.error.js";
import { RegisterCompanyRecruiterTypeZ } from "../models/companyrecruiter.model.js";

// ? Get all company recruiters.
export const GetAllCompanyRecruitersService = async () => {
  const companyRecruiters = await prisma.companyRecruiter.findMany({
    select: {
      id: true,
      companyName: true,
      email: true,
      phoneNumber: true,
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

// ? Update comapny recruiter by id.
export const UpdateCompanyRecruiterByIdService = async (
  id: number,
  data: RegisterCompanyRecruiterTypeZ,
) => {
  const hashedPassword = await bcrypt.hash(data.password, 12);
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
