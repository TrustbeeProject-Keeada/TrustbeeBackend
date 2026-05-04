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

/**
 * Send notification email to auto-provisioned recruiter
 * Informs them that an account has been created and a candidate is interested
 */
export async function sendRecruiterNotificationEmail(data: {
  recruiterEmail: string;
  recruiterName: string;
  jobSeekerName: string;
  companyName: string;
  accountSetupUrl: string;
}) {
  const emailHtml = `
    <h2>Welcome to Trustbee, ${data.recruiterName}!</h2>
    <p>An account has been created for <strong>${data.companyName}</strong> on Trustbee.</p>
    
    <p>A job candidate, <strong>${data.jobSeekerName}</strong>, is interested in applying for a position at your company.</p>
    
    <p>To get started and manage your account:</p>
    <ol>
      <li>Visit: <a href="${data.accountSetupUrl}">${data.accountSetupUrl}</a></li>
      <li>Set up your account with your actual email address and preferences</li>
      <li>View candidate messages and manage applications</li>
    </ol>
    
    <p>If you have any questions, please contact our support team.</p>
    
    <p>Best regards,<br>Trustbee Team</p>
  `;

  return mailer.sendMail({
    from: `"Trustbee" <${process.env.ADMIN_EMAIL}>`,
    to: data.recruiterEmail,
    subject: `Your Trustbee account is ready - ${data.jobSeekerName} is interested!`,
    html: emailHtml,
    text: `
Welcome to Trustbee, ${data.recruiterName}!

An account has been created for ${data.companyName} on Trustbee.

A job candidate, ${data.jobSeekerName}, is interested in applying for a position at your company.

To get started, visit: ${data.accountSetupUrl}

Best regards,
Trustbee Team
    `,
  });
}
