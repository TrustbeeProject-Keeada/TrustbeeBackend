import { Request, Response, NextFunction } from "express";
import { SupportTicketService } from "../services/support.services.js";

export class SupportTicketController {
  static async submit(req: Request, res: Response, next: NextFunction) {
    try {
      // Datan är redan validerad av middleware när vi når hit
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
      next(err); // Skickar felet till din globala error handler
    }
  }
}
