import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AppError } from "../utils/app.error.js";

// 1. Detta säger åt TypeScript att Express Request-objekt nu har en 'jobseeker'
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number; // Använder number eftersom ditt ID i databasen är en Int
        role: string;
      };
    }
  }
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    // 2. Vi använder return next() istället för throw i en asynkron funktion!
    return next(new AppError("Unauthorized", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    const payload = decoded as JwtPayload;

    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (error) {
    console.log(error);
    next(error);
  }
};

type UserRole = "JOB_SEEKER" | "ADMIN" | "COMPANY_RECRUITER";

export const restrictTo = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user || !roles.includes(user.role as UserRole)) {
      return res.status(403).json({
        message: "Forbidden, you do not have the required permissions",
      });
    }
    next();
  };
};
