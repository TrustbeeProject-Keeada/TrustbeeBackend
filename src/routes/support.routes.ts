import { Router } from "express";
import { SupportTicketController } from "../controllers/support.controller.js";
import { validate } from "../middleware/validate.middleware.js"; // Se till att sökvägen stämmer
import { supportTicketSchema } from "../models/support.model.js";

const router = Router();

// Vi använder 'validate' middleware för att kontrollera datan INNAN den når controllern
router.post("/", validate(supportTicketSchema), SupportTicketController.submit);

export default router;
