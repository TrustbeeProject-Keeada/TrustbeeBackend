import { z } from "zod";

export const sendMessageValidation = z.object({
  body: z.object({
    content: z.string().min(1, "Message cannot be empty"),
    receiverId: z
      .number({ message: "Receiver ID is required" }) // Ändrat till 'message'
      .int()
      .positive(),
    receiverRole: z.enum(["JOB_SEEKER", "COMPANY_RECRUITER"], {
      message: "Receiver role must be 'jobseeker' or 'companyrecruiter'", // Ändrat till 'message'
    }),
  }),
});

export type SendMessageTypeZ = z.infer<typeof sendMessageValidation>["body"];
