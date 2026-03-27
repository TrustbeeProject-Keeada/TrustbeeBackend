import { Router } from "express";
import {
  sendMessage,
  getConversation,
  getAllConversationsList,
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
  "/received",
  protect,
  restrictTo("JOB_SEEKER", "COMPANY_RECRUITER"),
  getAllConversationsList,
);

router.get(
  "/:otherId",
  protect,
  restrictTo("JOB_SEEKER", "COMPANY_RECRUITER"),
  getConversation,
);

export default router;
