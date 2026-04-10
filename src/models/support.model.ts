import { z } from "zod";

export const supportTicketSchema = z.object({
  body: z
    .object({
      firstname: z.string().min(2, "Förnamnet är för kort"),
      lastname: z.string().min(2, "Efternamnet är för kort"),
      email: z.string().email("Ange en giltig e-postadress"),
      message: z
        .string()
        .min(10, "Meddelandet måste vara minst 10 tecken långt"),
      sendAsEmail: z.boolean().optional().default(false),
    })
    .strict(),
});

export type SupportTicketType = z.infer<typeof supportTicketSchema>["body"];
