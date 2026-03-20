import { Router } from "express";
import {
  LogInJobSeeker,
  RegisterJobSeeker,
} from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  logInJobSeekerValidation,
  registerJobSeekerValidation,
} from "../models/jobseeker.model.js";

const router = Router();

router.post(
  "/register",
  validate(registerJobSeekerValidation),
  RegisterJobSeeker,
);
router.post("/login", validate(logInJobSeekerValidation), LogInJobSeeker);

export default router;
