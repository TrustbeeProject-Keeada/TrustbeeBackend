import { z } from "zod";

export const registerJobSeekerValidation = z.object({
  body: z
    .object({
      firstName: z.string("Please enter a valid name").min(2),
      lastName: z.string("Please enter a valid last name").min(2),
      email: z.email("Please enter a valid email"),
      password: z.string("Please enter a valid password").min(8),
      cv: z.string("Please enter a valid CV").optional(),
      personalStatement: z
        .string("Please enter a valid personal statement")
        .optional(),
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
      firstName: z.string("Please enter a valid name").min(2).optional(),
      lastName: z.string("Please enter a valid last name").min(2).optional(),
      email: z.email("Please enter a valid email").optional(),
      password: z.string("Please enter a valid password").min(8).optional(),
      phoneNumber: z
        .string()
        .regex(
          /^\+?(\d{1,3})?[-.\s]?\(?\d{1,4}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/,
          "Invalid phone number format",
        )
        .optional(),
      city: z.string().min(1, "City cannot be empty").optional(),
      country: z.string().min(1, "Country cannot be empty").optional(),
      bio: z.string("Please enter a valid bio").optional(),
      portfolioLink: z
        .string()
        .url("Please enter a valid portfolio link")
        .optional(),
      languages: z.array(z.string("Please enter a valid language")).optional(),
      skills: z.array(z.string("Please enter a valid skill")).optional(),
      cv: z.string("Please enter a valid CV").optional(),
      personalStatement: z
        .string("Please enter a valid personal statement")
        .optional(),
      profilePicture: z
        .string("Please enter a valid profile picture URL")
        .optional(),
    })
    .strict(),
});

export type RegisterJobSeekerTypeZ = z.infer<
  typeof registerJobSeekerValidation
>["body"];

export type LogInJobSeekerTypeZ = z.infer<
  typeof logInJobSeekerValidation
>["body"];

export type UpdateJobSeekerTypeZ = z.infer<
  typeof updateJobSeekerValidation
>["body"];
