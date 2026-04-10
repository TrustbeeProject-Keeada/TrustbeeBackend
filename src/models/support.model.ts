import { z } from "zod";

export const supportTicketSchema = z.object({
  body: z
    .object({
      firstname: z.string().min(2, "First name is too short"),
      lastname: z.string().min(2, "Last name is too short"),
      email: z.string().email("Please enter a valid email address"),
      message: z
        .string()
        .min(10, "Message must be at least 10 characters long"),
      sendAsEmail: z.boolean().optional().default(false),
    })
    .strict(),
});

export type SupportTicketType = z.infer<typeof supportTicketSchema>["body"];
