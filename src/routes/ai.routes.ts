import { Router } from "express";
import { api_health } from "../ai_implementation/ai_instance.js";
import {
  MatchMakingController,
  GenerateCvController,
  GenerateCvPdfController,
} from "../controllers/ai.controller.js";

const router = Router();

router.get("/api_health", async (req, res) => {
  const health = await api_health();
  res.json({ status: "ok✅", timestamp: new Date().toISOString(), ai: health });
});

router.post("/matchmake", MatchMakingController);

router.post("/generate-cv/:jobseekerId", GenerateCvController);

router.post("/generate-cv-pdf/:jobseekerId", GenerateCvPdfController);

export default router;
