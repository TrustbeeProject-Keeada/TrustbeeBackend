import express, { type Request, type Response } from "express";
import jobSeekerRoutes from "./routes/jobseeker.routes.js";
import authRoutes from "./routes/auth.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import jobRoutes from "./routes/job.routes.js";
import companyRecruiterRoutes from "./routes/companyrecruiter.routes.js";
import messageRoutes from "./routes/message.routes.js";
import "./ai_implementation/ai_instance.js";
import { api_health } from "./ai_implementation/ai_instance.js";
import applicationRoutes from "./routes/application.routes.js";
import supportRoutes from "./routes/support.routes.js";

export const createApp = () => {
  const app = express();

  app.use(express.json());

  // job seeker routes
  app.use("/api/jobseekers", jobSeekerRoutes);
  app.use("/api/companyrecruiter", companyRecruiterRoutes);

  // message routes
  app.use("/api/messages", messageRoutes);
  app.use("/api/applications", applicationRoutes);

  // job routes
  app.use("/api/jobs", jobRoutes);

  // auth routes
  app.use("/api/auth", authRoutes);

  // support routes
  app.use("/api", supportRoutes);

  // AI routes
  app.use("/api/ai", aiRoutes);

  app.use(errorHandler);

  app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
      status: "ok✅",
      timestamp: new Date().toISOString(),
      ai: api_health(),
    });
  });
  return app;
};
