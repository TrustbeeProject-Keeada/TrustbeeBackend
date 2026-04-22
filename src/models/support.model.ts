import { z } from "zod";

export const supportTicketSchema = z.object({
  body: z
    .object({
      firstname: z.string().min(2, "The firstname is too short"),
      lastname: z.string().min(2, "The lastname is too short"),
      email: z.string().email("Please enter a valid email address"),
      message: z
        .string()
        .min(10, "The message must be at least 10 characters long"),
      sendAsEmail: z.boolean().optional().default(false),
    })
    .strict(),
});

export type SupportTicketType = z.infer<typeof supportTicketSchema>["body"];
