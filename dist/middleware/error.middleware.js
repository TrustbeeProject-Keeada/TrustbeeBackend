import mongoose from "mongoose";
import { ZodError } from "zod";
import { AppError } from "../utils/app.error.js";
// src/middleware/error.ts
export const errorHandler = (err, req, res, next) => {
    // Express requires all 4 params for error middleware.
    void req;
    void next;
    let statusCode = 500;
    let message = "Server Error";
    let details;
    let errors;
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
    // Mongoose invalid ObjectId / cast issues (e.g. /users/not-an-id)
    if (err instanceof mongoose.Error.CastError) {
        statusCode = 400;
        message = `Invalid ${err.path}`;
        details = { path: err.path, value: err.value };
    }
    // Mongoose schema validation errors
    if (err instanceof mongoose.Error.ValidationError) {
        statusCode = 400;
        message = "Database Validation Error";
        details = Object.values(err.errors).map((e) => ({
            path: e.path,
            message: e.message,
        }));
    }
    // Mongo duplicate key error (unique indexes), e.g. duplicate email
    if (typeof err === "object" &&
        err !== null &&
        "code" in err &&
        err.code === 11000) {
        statusCode = 409;
        message = "Duplicate key error";
        details = err.keyValue ?? err.keyPattern;
    }
    res.status(statusCode).json({ message, details, errors });
};
