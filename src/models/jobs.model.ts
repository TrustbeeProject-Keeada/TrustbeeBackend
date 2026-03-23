import { stat } from "node:fs";
import { z } from "zod";

export const createJobValidation = z.object({
  body: z
    .object({
      companyId: z.number("Please enter a valid company ID"),
      title: z.string("Please enter a valid job title").min(2),
      description: z.string("Please enter a valid job description").min(10),
      expiresAt: z.string("Please enter a valid expiration date").min(10),
      status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
    })
    .strict(),
});

export const updateJobValidation = z.object({
  body: z
    .object({
      companyId: z.number("Please enter a valid company ID").min(2).optional(),
      title: z.string("Please enter a valid job title").min(2).optional(),
      description: z
        .string("Please enter a valid job description")
        .min(10)
        .optional(),
      expiresAt: z
        .string("Please enter a valid expiration date")
        .min(10)
        .optional(),
      status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
    })
    .strict(),
});

export type CreateJobTypeZ = z.infer<typeof createJobValidation>["body"];
export type UpdateJobTypeZ = z.infer<typeof updateJobValidation>["body"];
