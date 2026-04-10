import { prisma } from "../config/db.js";
import { SupportTicketType } from "../models/support.model.js";

export class SupportTicketService {
  /**
   * Skapar en supportbiljett i databasen och hanterar eventuellt mejlutskick.
   */
  static async createTicket(data: SupportTicketType, sendAsEmail: boolean) {
    // 1. Spara i databasen (viktigt för historik och admin-vy)
    const newTicket = await prisma.supportTicket.create({
      data: {
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        message: data.message,
        sendAsEmail: sendAsEmail,
      },
    });

    // 2. Om användaren valt att skicka som mejl
    if (sendAsEmail) {
      await this.sendSupportEmail(newTicket);
    }

    return newTicket;
  }

  /**
   * Intern metod för att hantera mejllogik (t.ex. via Nodemailer)
   */
  private static async sendSupportEmail(ticket: any) {
    // Här lägger du senare in din Nodemailer-logik.
    // Just nu simulerar vi bara att mejlet skickas.
    console.log(
      `[EMAIL SERVICE]: Sending ticket #${ticket.id} to support@trustbee.se`,
    );
    console.log(
      `From: ${ticket.email} - Message: ${ticket.message.substring(0, 20)}...`,
    );
  }
}
