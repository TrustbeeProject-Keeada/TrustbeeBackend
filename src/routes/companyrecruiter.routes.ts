import { Router } from "express";
import {
  GetCompanyRecruiters,
  GetCompanyRecruitersById,
  UpdateCompanyRecruiterById,
  DeleteCompanyRecruiterById,
} from "../controllers/companyrecruiter.controller.js";
import { validate } from "../middleware/validate.middleware.js";

const router = Router();

router.get("/", GetCompanyRecruiters);
router.get("/:id", GetCompanyRecruitersById);
router.patch("/:id", UpdateCompanyRecruiterById);
router.delete("/:id", DeleteCompanyRecruiterById);

export default router;
