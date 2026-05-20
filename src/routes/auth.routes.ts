import { Router } from "express";

import {
  LogInJobSeeker,
  RegisterJobSeeker,
  RegisterCompanyRecruiter,
  LogInCompanyRecruiter,
  Logout,
  ForgotPassword,
  ResetPassword,
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
import {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
} from "../middleware/limiters.js";

const router = Router();

router.post(
  "/registerjobseeker",
  registerLimiter,
  validate(registerJobSeekerValidation),
  RegisterJobSeeker,
);
router.post(
  "/loginjobseeker",
  loginLimiter,
  validate(logInJobSeekerValidation),
  LogInJobSeeker,
);

router.post(
  "/registercompanyrecruiter",
  registerLimiter,
  validate(registerJobRecruiterValidation),
  RegisterCompanyRecruiter,
);

router.post(
  "/logincompanyrecruiter",
  loginLimiter,
  validate(loginJobRecruiterValidation),
  LogInCompanyRecruiter,
);

router.post("/logout", Logout);

router.post("/forgot-password", forgotPasswordLimiter, ForgotPassword);
router.post("/reset-password", ResetPassword);

export default router;
