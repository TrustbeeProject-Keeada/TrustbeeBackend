import { Router } from "express";
import {
  saveJob,
  unsaveJob,
  getSavedJobs,
  saveCompany,
  unsaveCompany,
  getSavedCompanies,
} from "../controllers/saved.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect);
router.use(restrictTo("JOB_SEEKER"));

router.get("/jobs", getSavedJobs);
router.post("/jobs/:jobId", saveJob);
router.delete("/jobs/:jobId", unsaveJob);

router.get("/companies", getSavedCompanies);
router.post("/companies/:companyId", saveCompany);
router.delete("/companies/:companyId", unsaveCompany);

export default router;
