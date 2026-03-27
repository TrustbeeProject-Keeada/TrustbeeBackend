import { z } from "zod";
export const sendMessageValidation = z.object({
    body: z
        .object({
        content: z.string().min(1, "Message cannot be empty"),
        receiverId: z
            .number({ message: "Receiver ID is required" }) // Ändrat till 'message'
            .positive(),
        receiverRole: z.enum(["JOB_SEEKER", "COMPANY_RECRUITER"], {
            message: "Receiver role must be 'JOB_SEEKER' or 'COMPANY_RECRUITER'", // Ändrat till 'message'
        }),
    })
        .strict(),
});
