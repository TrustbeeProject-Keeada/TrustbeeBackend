import { Router } from "express";
import {
  getAllJobs,
  getJobById,
  createJob,
  updateJobById,
  deleteJobById,
} from "../controllers/job.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createJobValidation,
  updateJobValidation,
} from "../models/jobs.model.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", getAllJobs);
router.get("/:id", getJobById);
router.post(
  "/",
  protect,
  restrictTo("COMPANY_RECRUITER"),
  validate(createJobValidation),
  createJob,
);
router.patch("/:id", validate(updateJobValidation), updateJobById);
router.delete("/:id", deleteJobById);

export default router;
