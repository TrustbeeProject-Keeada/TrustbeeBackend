import type { ErrorRequestHandler } from "express";
import { Prisma } from "../generated/prisma/index.js";
import { ZodError } from "zod";
import { AppError } from "../utils/app.error.js";

// src/middleware/error.ts
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // Express requires all 4 params for error middleware.
  void req;
  void next;

  console.error("ErrorHandler caught error:", err);

  let statusCode = 500;
  let message = "Server Error";
  let details: unknown;
  let errors:
    | Array<{ path: string; message: string; code?: string }>
    | undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Zod (v4) validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation Error";
    // make it the human-friendly list.
    details = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }));
  }

  // Prisma errorsA
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle specific Prisma error codes
    // P2002: Unique constraint failed
    // P2025: Record not found
    if (err.code === "P2002") {
      statusCode = 409;
      message = "Duplicate key error: A record with this value already exists.";
      details = {
        fields: err.meta?.target,
      };
    } else if (err.code === "P2025") {
      statusCode = 404;
      message = "Record not found.";
    }
  }

  if (statusCode === 500) {
    console.error("Unexpected error:", err);
  }

  res.status(statusCode).json({
    message,
    ...(details !== undefined ? { details } : {}),
  });
};
