import { Router } from "express";
import {
  sendMessage,
  getConversation,
} from "../controllers/message.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { sendMessageValidation } from "../models/message.model.js";

const router = Router();

// Du måste vara inloggad för att använda DM
router.use(protect);

// POST /api/messages - Skicka ett meddelande
router.post("/", validate(sendMessageValidation), sendMessage);

// GET /api/messages/:otherId/:otherRole - Hämta chatthistorik
router.get("/:otherId/:otherRole", getConversation);

export default router;
