import { Router } from "express";
import { SupportTicketController } from "../controllers/support.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { supportTicketSchema } from "../models/support.model.js";
// Importera BÅDA limiters nu:
import { ipLimiter, emailLimiter } from "../middleware/support.limiter.js";

const router = Router();

router.post(
  "/",
  ipLimiter, // 1. Kolla om hela datorn skickat mer än 20 anrop
  emailLimiter, // 2. Kolla om just denna e-post skickat mer än 3 anrop
  validate(supportTicketSchema),
  SupportTicketController.submit,
);

export default router;
