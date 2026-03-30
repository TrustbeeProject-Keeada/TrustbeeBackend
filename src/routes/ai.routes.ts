import { Router } from "express";
import { api_health } from "../ai_implementation/ai_instance.js";
import { MatchMakingController } from "../controllers/ai.controller.js";

const router = Router();

router.get("/api_health", async (req, res) => {
  const health = await api_health();
  res.json({ status: "ok✅", timestamp: new Date().toISOString(), ai: health });
});

router.post("/matchmake", MatchMakingController);

export default router;
