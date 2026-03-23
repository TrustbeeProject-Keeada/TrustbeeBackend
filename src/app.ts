import express, { type Request, type Response } from "express";
import jobSeekerRoutes from "./routes/jobseeker.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import jobRoutes from "./routes/job.routes.js";
import companyRecruiterRoutes from "./routes/companyrecruiter.routes.js";

export const createApp = () => {
  const app = express();

  app.use(express.json());

  // job seeker routes
  app.use("/api/jobseekers", jobSeekerRoutes);
  app.use("/api/companyrecruiter", companyRecruiterRoutes);
  // app.use("/api/companyrecruiter", )

  // job routes
  app.use("/api/jobs", jobRoutes);
  // auth routes
  app.use("/api/auth", authRoutes);

  app.use(errorHandler);

  app.get("/health", (req: Request, res: Response) => {
    res
      .status(200)
      .json({ status: "ok✅", timestamp: new Date().toISOString() });
  });
  return app;
};
