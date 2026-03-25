import { Router } from "express";
import { api_health } from "../ai_implementation/ai_instance.js";

import {
  LogInJobSeeker,
  RegisterJobSeeker,
  RegisterCompanyRecruiter,
  LogInCompanyRecruiter,
} from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  logInJobSeekerValidation,
  registerJobSeekerValidation,
} from "../models/jobseeker.model.js";
import {
  registerJobRecruiterValidation,
  loginJobRecruiterValidation,
} from "../models/companyrecruiter.model.js";

const router = Router();

router.post(
  "/registerjobseeker",
  validate(registerJobSeekerValidation),
  RegisterJobSeeker,
);
router.post(
  "/loginjobseeker",
  validate(logInJobSeekerValidation),
  LogInJobSeeker,
);

router.post(
  "/registercompanyrecruiter",
  validate(registerJobRecruiterValidation),
  RegisterCompanyRecruiter,
);

router.post(
  "/logincompanyrecruiter",
  validate(loginJobRecruiterValidation),
  LogInCompanyRecruiter,
);

router.get(
  "/api_health",
  async (req, res) => {
    const health = await api_health();
    res.json({ status: "ok✅", timestamp: new Date().toISOString(), ai: health });
  }
);


export default router;

