import { Router } from "express";
import {
  applyForJob,
  getJobApplications,
  updateApplicationStatus,
  applyOnWebsite,
} from "../controllers/application.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { updateApplicationStatusValidation } from "../models/application.model.js";
import { applyLimiter } from "../middleware/limiters.js";

const router = Router();

router.use(protect);

router.post("/job/:jobId", restrictTo("JOB_SEEKER"), applyLimiter, applyForJob);
router.post("/website/:jobBankId", restrictTo("JOB_SEEKER"), applyLimiter, applyOnWebsite);

router.get(
  "/job/:jobId",
  restrictTo("COMPANY_RECRUITER", "ADMIN"),
  getJobApplications,
);

router.patch(
  "/:id/status",
  restrictTo("COMPANY_RECRUITER", "ADMIN"),
  validate(updateApplicationStatusValidation),
  updateApplicationStatus,
);

export default router;
