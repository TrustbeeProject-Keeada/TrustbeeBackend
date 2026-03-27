import { z } from "zod";
export const registerJobSeekerValidation = z.object({
    body: z
        .object({
        firstname: z.string("Please enter a valid name").min(2),
        lastname: z.string("Please enter a valid last name").min(2),
        email: z.email("Please enter a valid email"),
        password: z.string("Please enter a valid password").min(8),
    })
        .strict(),
});
export const logInJobSeekerValidation = z.object({
    body: z
        .object({
        email: z.email("Please enter a valid email"),
        password: z.string("Please enter a valid password").min(8),
    })
        .strict(),
});
export const updateJobSeekerValidation = z.object({
    body: z
        .object({
        firstname: z.string("Please enter a valid name").min(2).optional(),
        lastname: z.string("Please enter a valid last name").min(2).optional(),
        email: z.email("Please enter a valid email").optional(),
        password: z.string("Please enter a valid password").min(8).optional(),
    })
        .strict(),
});
