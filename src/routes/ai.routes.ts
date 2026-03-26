import { Router } from "express";
import { api_health, job_matching_evaluation } from "../ai_implementation/ai_instance.js";

const router = Router();


router.get("/api_health", async (req, res) => {
  const health = await api_health();
  res.json({ status: "ok✅", timestamp: new Date().toISOString(), ai: health });
});

router.get("/matchmake", async (req, res) => {
  const health = await job_matching_evaluation();
  res.json({ status: "ok✅", timestamp: new Date().toISOString(), ai: health });
});


export default router;