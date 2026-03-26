import { z } from "zod";

export const updateApplicationStatusValidation = z.object({
  body: z
    .object({
      status: z.enum(["PENDING", "REVIEWED", "ACCEPTED", "REJECTED"], {
        message: "Status must be PENDING, REVIEWED, ACCEPTED, or REJECTED",
      }),
    })
    .strict(),
});

export type UpdateApplicationStatusTypeZ = z.infer<
  typeof updateApplicationStatusValidation
>["body"];
