import { z } from "zod";

// ? // ! register is email, password, company name, organization number, phone number, description OPTIONAL, logo url OPTIONAL
export const registerJobRecruiterValidation = z.object({
  body: z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    companyname: z.string().min(1, "Company name is required"),
    organizationnumber: z.number(
      "Organization number must be a positive integer",
    ),
    phonenumber: z
      .string()
      .regex(
        /^\+?(\d{1,3})?[-.\s]?\(?\d{1,4}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/,
        "Invalid phone number format",
      ),
  }),
});

// ? login is email and password
export const loginJobRecruiterValidation = z.object({
  body: z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
  }),
});

export type RegisterCompanyRecruiterTypeZ = z.infer<
  typeof registerJobRecruiterValidation
>["body"];

export type LoginCompanyRecruiterTypeZ = z.infer<
  typeof loginJobRecruiterValidation
>["body"];
