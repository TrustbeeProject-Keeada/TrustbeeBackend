import { Router } from "express";
import { applyForJob, getJobApplications, updateApplicationStatus, } from "../controllers/application.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { updateApplicationStatusValidation } from "../models/application.model.js";
const router = Router();
// Alla rutter här kräver att man är inloggad
router.use(protect);
// Job_Seeker: Ansök till ett jobb
router.post("/job/:jobId", restrictTo("JOB_SEEKER"), applyForJob);
// Company_Recruiter: Se alla ansökningar för ett specifikt jobb
router.get("/job/:jobId", restrictTo("COMPANY_RECRUITER", "ADMIN"), getJobApplications);
// Company_Recruiter: Ändra status (Acceptera/Neka) på en specifik ansökan
router.patch("/:id/status", restrictTo("COMPANY_RECRUITER", "ADMIN"), validate(updateApplicationStatusValidation), updateApplicationStatus);
export default router;
