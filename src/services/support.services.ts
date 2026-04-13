import { prisma } from "../config/db.js";
import { SupportTicketType } from "../models/support.model.js";
import { AppError } from "../utils/app.error.js";

export class SupportTicketService {
  static async createTicket(data: SupportTicketType, sendAsEmail: boolean) {
    // 1. DUBBLETT-KOLL (Spärr mot spam av samma text från samma person)
    const duplicate = await prisma.supportTicket.findFirst({
      where: {
        email: data.email,
        message: data.message,
        createdAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000), // Kollar 10 minuter bakåt
        },
      },
    });

    if (duplicate) {
      throw new AppError("Du har redan skickat detta meddelande nyligen.", 400);
    }

    // 2. SPARA I DATABASEN
    const newTicket = await prisma.supportTicket.create({
      data: {
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        message: data.message,
        sendAsEmail: sendAsEmail,
      },
    });

    // 3. SIMULERA MEJLUTSKICK
    if (sendAsEmail) {
      console.log(
        `[MAIL]: Ticket #${newTicket.id} skickad till supporten från ${data.email}.`,
      );
    }

    return newTicket;
  }
}
