import { Router } from "express";
import {
  sendMessage,
  getConversation,
} from "../controllers/messages.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { sendMessageValidation } from "../models/message.model.js";

const router = Router();

router.post(
  "/",
  protect,
  restrictTo("JOB_SEEKER", "COMPANY_RECRUITER"),
  validate(sendMessageValidation),
  sendMessage,
);

router.get(
  "/:otherId",
  protect,
  restrictTo("JOB_SEEKER", "COMPANY_RECRUITER"),
  getConversation,
);

export default router;
