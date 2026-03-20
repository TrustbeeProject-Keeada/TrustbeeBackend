import { z } from "zod";

// ? // ! register is email, password, company name, organization number, phone number, description OPTIONAL, logo url OPTIONAL
export const registerJobRecruiterValidation = z.object({
  body: z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    companyName: z.string().min(1, "Company name is required"),
    organizationNumber: z
      .number()
      .int()
      .positive("Organization number must be a positive integer"),
    phoneNumber: z.number(),
  }),
});
