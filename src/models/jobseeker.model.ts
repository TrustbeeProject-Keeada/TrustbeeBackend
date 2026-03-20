import { z } from "zod";

export const registerJobSeekerValidation = z.object({
  body: z.object({
    firstName: z.string("Please enter a valid name").min(2),
    lastName: z.string("Please enter a valid last name").min(2),
    email: z.email("Please enter a valid email"),
    password: z.string("Please enter a valid password").min(8),
  }),
});

export type CreateJobSeekerTypeZ = z.infer<
  typeof registerJobSeekerValidation
>["body"];
