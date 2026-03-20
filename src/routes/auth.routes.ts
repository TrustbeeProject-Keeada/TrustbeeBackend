import { Router } from "express";
import { RegisterJobSeeker } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { registerJobSeekerValidation } from "../models/jobseeker.model.js";

const router = Router();

router.post("/", validate(registerJobSeekerValidation), RegisterJobSeeker);

export default router;
