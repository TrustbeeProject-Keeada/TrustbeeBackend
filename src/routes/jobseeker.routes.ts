import { Router } from "express";
import {
  deleteJobSeekerById,
  getJobSeekerById,
  getJobSeekers,
  updateJobSeekerById,
} from "../controllers/jobseeker.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { updateJobSeekerValidation } from "../models/jobseeker.model.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", getJobSeekers);
router.get("/:id", getJobSeekerById);
router.patch(
  "/:id",
  protect,
  restrictTo("JOB_SEEKER", "ADMIN"),
  validate(updateJobSeekerValidation),
  updateJobSeekerById,
);
router.delete(
  "/:id",
  protect,
  restrictTo("JOB_SEEKER", "ADMIN"),
  deleteJobSeekerById,
);

export default router;
