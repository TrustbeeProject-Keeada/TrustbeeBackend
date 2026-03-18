import express, { type Request, type Response } from "express";
import console = require("node:console");
import userRoutes from "./routes/user.routes";
import { errorHandler } from "./middlewere/error.middlewere";
import newsRoutes from "./routes/product.routes";
import authRoutes from "./routes/auth.routes";
import orderRoutes from "./routes/orders.routes";

export const createApp = () => {
  const app = express();

  app.use(express.json());

  app.use("/api", authRoutes);
  app.use("/api", userRoutes);
  app.use("/api", newsRoutes);
  app.use("/api", orderRoutes);

  app.use(errorHandler);

  app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });
  return app;
};
