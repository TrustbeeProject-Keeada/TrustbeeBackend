import { Router } from "express";
import {
  deleteJobSeekerById,
  getJobSeekerById,
  getJobSeekers,
  updateJobSeekerById,
} from "../controllers/jobseeker.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { updateJobSeekerValidation } from "../models/jobseeker.model.js";

const router = Router();

router.get("/", getJobSeekers);
router.get("/:id", getJobSeekerById);
router.patch("/:id", validate(updateJobSeekerValidation), updateJobSeekerById);
router.delete("/:id", deleteJobSeekerById);

export default router;
