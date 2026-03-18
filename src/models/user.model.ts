import { z } from "zod";

export const createUserValidation = z.object({
  body: z.object({
    firstname: z.string("Please enter a valid name").min(2),
    lastname: z.string("Please enter a valid last name").min(2),
    email: z.email("Please enter a valid email"),
    password: z.string("Please enter a valid password").min(8),
  }),
});

export type CreateUserTypeZ = z.infer<typeof createUserValidation>["body"];
