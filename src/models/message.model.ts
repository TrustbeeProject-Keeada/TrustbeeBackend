import { z } from "zod";

export const sendMessageValidation = z.object({
  body: z.object({
    content: z.string().min(1, "Message cannot be empty"),
    receiverId: z
      .number({ required_error: "Receiver ID is required" })
      .int()
      .positive(),
    receiverRole: z.enum(["jobseeker", "companyrecruiter"], {
      required_error: "Receiver role must be 'jobseeker' or 'companyrecruiter'",
    }),
  }),
});

export type SendMessageTypeZ = z.infer<typeof sendMessageValidation>["body"];
