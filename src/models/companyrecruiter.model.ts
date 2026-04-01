import { z } from "zod";

// ? // ! register is email, password, company name, organization number, phone number, description OPTIONAL, logo url OPTIONAL
export const registerJobRecruiterValidation = z.object({
  body: z
    .object({
      email: z.email("Invalid email address"),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters long"),
      companyName: z.string().min(1, "Company name is required"),
      organizationNumber: z
        .number()
        .positive("Organization number must be a positive integer"),
      phoneNumber: z
        .string()
        .regex(
          /^\+?(\d{1,3})?[-.\s]?\(?\d{1,4}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/,
          "Invalid phone number format",
        ),
      description: z.string().optional(),
      logoUrl: z.string().url("Invalid logo URL").optional(),
    })
    .strict(),
});

// ? login is email and password
export const loginJobRecruiterValidation = z.object({
  body: z
    .object({
      email: z.email("Invalid email address"),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters long"),
    })
    .strict(),
});

export const updateJobRecruiterValidation = z.object({
  body: z
    .object({
      email: z.email("Invalid email address").optional(),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .optional(),
      companyName: z.string().min(1, "Company name is required").optional(),
      organizationNumber: z
        .number("Organization number must be a positive integer")
        .optional(),
      phoneNumber: z
        .string()
        .regex(
          /^\+?(\d{1,3})?[-.\s]?\(?\d{1,4}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/,
          "Invalid phone number format",
        )
        .optional(),
      description: z.string().optional(),
      logoUrl: z.string().url("Invalid logo URL").optional(),
      city: z.string().min(1, "City cannot be empty").optional(),
      country: z.string().min(1, "Country cannot be empty").optional(),
      industry: z.string().min(1, "Industry cannot be empty").optional(),
    })
    .strict(),
});

export type UpdateCompanyRecruiterTypeZ = z.infer<
  typeof updateJobRecruiterValidation
>["body"];

export type RegisterCompanyRecruiterTypeZ = z.infer<
  typeof registerJobRecruiterValidation
>["body"];

export type LoginCompanyRecruiterTypeZ = z.infer<
  typeof loginJobRecruiterValidation
>["body"];
