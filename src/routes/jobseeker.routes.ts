import { Router } from "express";
import {
  deleteJobSeekerById,
  getJobSeekerById,
  getJobSeekers,
  updateJobSeekerById,
} from "../controllers/jobseeker.controller.js";

const router = Router();

router.get("/", getJobSeekers);
router.get("/:id", getJobSeekerById);
router.patch("/:id", updateJobSeekerById);
router.delete("/:id", deleteJobSeekerById);

export default router;
