import express, { type Request, type Response } from "express";
import cors, { type CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import jobSeekerRoutes from "./routes/jobseeker.routes.js";
import authRoutes from "./routes/auth.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import jobRoutes from "./routes/job.routes.js";
import companyRecruiterRoutes from "./routes/companyrecruiter.routes.js";

import "./ai_implementation/ai_instance.js";
import { api_health } from "./ai_implementation/ai_instance.js";
import applicationRoutes from "./routes/application.routes.js";
import supportRoutes from "./routes/support.routes.js";
import savedRoutes from "./routes/saved.routes.js";
import { globalLimiter } from "./middleware/limiters.js";

// Fail fast if critical env vars are missing or placeholder
const REQUIRED_ENV: Record<string, string | undefined> = {
  JWT_SECRET: process.env.JWT_SECRET,
};
for (const [key, value] of Object.entries(REQUIRED_ENV)) {
  if (!value || value === "replace_with_a_secure_random_value") {
    throw new Error(
      `Missing or placeholder env var: ${key}. Set a real value before starting the server.`,
    );
  }
}

export const createApp = () => {
  const app = express();

  const isProd = process.env.NODE_ENV === "production";

  // Trust one proxy hop (Render's load balancer) so X-Forwarded-For is correct
  if (isProd) app.set("trust proxy", 1);

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  // HTTP request logging — concise in production, detailed in dev
  app.use(morgan(isProd ? "combined" : "dev"));

  const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:8080")
    .split(",")
    .map((o) => o.trim());

  // Optional regex for Vercel preview deployments, e.g. "https://trustbee-frontend-.*\.vercel\.app"
  const corsPatternRaw = process.env.CORS_ORIGIN_PATTERN;
  const corsPattern = corsPatternRaw ? new RegExp(corsPatternRaw) : null;

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || (corsPattern && corsPattern.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error(`Origin not allowed: ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };

  app.use(cors(corsOptions));
  app.use(cookieParser());
  app.use(express.json({ limit: "500kb" }));
  app.use("/api", globalLimiter);

  app.use("/api/jobseekers", jobSeekerRoutes);
  app.use("/api/companyrecruiter", companyRecruiterRoutes);
  app.use("/api/applications", applicationRoutes);
  app.use("/api/jobs", jobRoutes);
  app.use("/api/saved", savedRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/support", supportRoutes);
  app.use("/api", aiRoutes);

  app.use(errorHandler);

  app.get("/health", async (req: Request, res: Response) => {
    let aiStatus: unknown = "disabled";
    if (process.env.gemini_api_key) {
      try {
        aiStatus = await api_health();
      } catch {
        aiStatus = "unavailable";
      }
    }
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      ai: aiStatus,
    });
  });

  return app;
};
