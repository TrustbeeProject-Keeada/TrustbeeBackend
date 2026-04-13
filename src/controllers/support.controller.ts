import { Request, Response, NextFunction } from "express";
import { SupportTicketService } from "../services/support.services.js";

export class SupportTicketController {
  static async submit(req: Request, res: Response, next: NextFunction) {
    try {
      // req.body är redan validerad av din Zod-middleware här
      const result = await SupportTicketService.createTicket(
        req.body,
        req.body.sendAsEmail,
      );

      res.status(201).json({
        status: "success",
        message: "Support ticket created successfully",
        data: result,
      });
    } catch (err) {
      next(err); // Skickar fel (t.ex. dubblett-felet) till din globala error handler
    }
  }
}
