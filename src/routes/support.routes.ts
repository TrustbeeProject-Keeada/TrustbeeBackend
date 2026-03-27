// src/routes/supportTicket.routes.ts
import { Router } from "express";
import { SupportTicketController } from "../controllers/support.controller.js";

const router = Router();

router.post("/support", SupportTicketController.submit);

export default router;
