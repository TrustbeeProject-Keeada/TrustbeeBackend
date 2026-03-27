import { SupportTicket } from "../models/support.model.js";
import { sendSupportMail } from "../utils/mailer.js";

const fakeDatabase: SupportTicket[] = []; // byt mot riktig DB

export class SupportTicketService {
  static async createTicket(data: SupportTicket, sendAsEmail: boolean) {
    if (sendAsEmail) {
      await sendSupportMail(data);
      return { status: "email_sent" };
    }

    const ticket: SupportTicket = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    fakeDatabase.push(ticket);
    return { status: "saved_to_db", ticket };
  }
}
