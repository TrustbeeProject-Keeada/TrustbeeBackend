import { z } from "zod";
export const createJobValidation = z.object({
    body: z
        .object({
        title: z.string("Please enter a valid job title").min(2),
        description: z.string("Please enter a valid job description").min(10),
        expiresAt: z.string("Please enter a valid expiration date").min(10),
    })
        .strict(),
});
export const updateJobValidation = z.object({
    body: z
        .object({
        title: z.string("Please enter a valid job title").min(2).optional(),
        description: z
            .string("Please enter a valid job description")
            .min(10)
            .optional(),
        expiresAt: z
            .string("Please enter a valid expiration date")
            .min(10)
            .optional(),
    })
        .strict(),
});
export const changeJobStatusValidation = z.object({
    body: z
        .object({
        status: z.enum(["ACTIVE", "ARCHIVED"], {
            message: "Please enter a valid job status (ACTIVE or ARCHIVED)",
        }),
    })
        .strict(),
});
