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
  validate(createJobValidation),
  protect,
  restrictTo("COMPANY_RECRUITER", "ADMIN"),
  createJob,
);
router.patch(
  "/:id",
  validate(updateJobValidation),
  protect,
  restrictTo("COMPANY_RECRUITER", "ADMIN"),
  updateJobById,
);
router.delete(
  "/:id",
  protect,
  restrictTo("COMPANY_RECRUITER", "ADMIN"),
  deleteJobById,
);

export default router;
