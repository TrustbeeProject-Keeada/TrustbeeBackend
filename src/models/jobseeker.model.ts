import { z } from "zod";

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

const optionalString = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(emptyStringToUndefined, schema.optional());

export const registerJobSeekerValidation = z.object({
  body: z
    .object({
      firstName: z.string("Please enter a valid name").min(2),
      lastName: z.string("Please enter a valid last name").min(2),
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
      firstName: optionalString(z.string("Please enter a valid name").min(2)),
      lastName: optionalString(
        z.string("Please enter a valid last name").min(2),
      ),
      email: optionalString(z.email("Please enter a valid email")),
      password: optionalString(
        z.string("Please enter a valid password").min(8),
      ),
      phoneNumber: optionalString(
        z
          .string()
          .min(12, "Phone number is too short")
          .max(15, "Phone number is too long")
          .regex(
            /^\+?(\d{1,3})?[-.\s]?\(?\d{1,4}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/,
            "Invalid phone number format",
          ),
      ),
      city: optionalString(z.string().min(1, "City cannot be empty")),
      country: optionalString(z.string().min(1, "Country cannot be empty")),
      bio: optionalString(z.string("Please enter a valid bio")),
      portfolioLink: optionalString(
        z.string().url("Please enter a valid portfolio link"),
      ),
      languages: z.array(z.string("Please enter a valid language")).optional(),
      skills: z.array(z.string("Please enter a valid skill")).optional(),
      cv: optionalString(z.string("Please enter a valid CV")),
      personalStatement: optionalString(
        z.string("Please enter a valid personal statement"),
      ),
      profilePicture: optionalString(
        z.string("Please enter a valid profile picture URL"),
      ),
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
