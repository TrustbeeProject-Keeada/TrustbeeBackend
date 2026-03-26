// src/controllers/supportTicket.controller.ts
import { Request, Response } from "express";
import { SupportTicketService } from "../services/support.services.js";

export class SupportTicketController {
  static async submit(req: Request, res: Response) {
    try {
      const { firstname, lastname, email, message, sendAsEmail } = req.body;

      if (!firstname || !lastname || !email || !message) {
        return res.status(400).json({ error: "Missing fields" });
      }

      const result = await SupportTicketService.createTicket(
        { firstname, lastname, email, message },
        sendAsEmail,
      );

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
