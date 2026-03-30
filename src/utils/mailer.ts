// src/utils/mailer.ts
import nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASSWORD,
  },
});

export async function sendSupportMail(data: {
  firstname: string;
  lastname: string;
  email: string;
  message: string;
}) {
  return mailer.sendMail({
    from: `"Support" <${process.env.ADMIN_EMAIL}>`,
    to: process.env.ADMIN_EMAIL,
    subject: "Ny supportförfrågan",
    text: `
      Namn: ${data.firstname} ${data.lastname}
      Email: ${data.email}
      Meddelande:
      ${data.message}
    `,
  });
}
