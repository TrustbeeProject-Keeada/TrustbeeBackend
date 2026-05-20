import nodemailer from "nodemailer";

const emailEnabled =
  Boolean(process.env.ADMIN_EMAIL) &&
  Boolean(process.env.ADMIN_EMAIL_PASSWORD);

export const mailer = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASSWORD,
  },
});

export async function sendPasswordResetMail(data: {
  to: string;
  resetUrl: string;
}) {
  if (!emailEnabled) {
    console.log(`[mailer disabled] Password reset link for ${data.to}: ${data.resetUrl}`);
    return;
  }
  return mailer.sendMail({
    from: `"Trustbee" <${process.env.ADMIN_EMAIL}>`,
    to: data.to,
    subject: "Reset your Trustbee password",
    html: `
      <p>You requested a password reset for your Trustbee account.</p>
      <p>Click the link below — it expires in <strong>1 hour</strong>.</p>
      <p><a href="${data.resetUrl}" style="color:#f59e0b;font-weight:bold;">Reset my password</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
    text: `Reset your Trustbee password\n\n${data.resetUrl}\n\nExpires in 1 hour. If you did not request this, ignore this email.`,
  });
}

export async function sendSupportMail(data: {
  firstname: string;
  lastname: string;
  email: string;
  message: string;
}) {
  if (!emailEnabled) {
    console.log(`[mailer disabled] Support ticket from ${data.email}: ${data.message}`);
    return;
  }
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

export async function sendRecruiterNotificationEmail(data: {
  recruiterEmail: string;
  recruiterName: string;
  jobSeekerName: string;
  companyName: string;
  accountSetupUrl: string;
}) {
  if (!emailEnabled) {
    console.log(`[mailer disabled] Recruiter notification for ${data.recruiterEmail}`);
    return;
  }
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
    text: `Welcome to Trustbee, ${data.recruiterName}!\n\nVisit: ${data.accountSetupUrl}\n\nBest regards,\nTrustbee Team`,
  });
}
