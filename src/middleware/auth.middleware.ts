import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AppError } from "../utils/app.error.js";

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log(token);

  if (!token) {
    throw new AppError("Unauthorized", 401);
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    const payload = decoded as JwtPayload;

    req.jobseeker = { id: payload.id, role: payload.role };
    next();
  } catch (error) {
    console.log(error);
    next(error);
  }
};

type UserRole = "jobseeker" | "admin" | "companyrecruiter";

export const restrictTo = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.jobseeker;

    if (!user || !roles.includes(user.role as UserRole)) {
      return res.status(403).json({
        message: "Forbidden, you do not have have the required permissions",
      });
    }
    next();
  };
};
