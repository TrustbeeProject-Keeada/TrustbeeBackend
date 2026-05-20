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

export async function sendInterviewBookedToJobSeeker(data: {
  jobSeekerEmail: string;
  jobSeekerFirstName: string;
  companyName: string;
  jobTitle: string;
}) {
  if (!emailEnabled) {
    console.log(`[mailer disabled] Interview booked notification for ${data.jobSeekerEmail}`);
    return;
  }
  return mailer.sendMail({
    from: `"TrustBee" <${process.env.ADMIN_EMAIL}>`,
    to: data.jobSeekerEmail,
    subject: `Interview invitation — ${data.jobTitle} at ${data.companyName}`,
    html: `
      <h2>Great news, ${data.jobSeekerFirstName}!</h2>
      <p><strong>${data.companyName}</strong> wants to book an interview with you for the position of <strong>${data.jobTitle}</strong>.</p>
      <p>They will be in touch with you soon to arrange the details. Make sure your contact information on TrustBee is up to date.</p>
      <p>Log in to <a href="${process.env.FRONTEND_URL || "https://trustbee.app"}">TrustBee</a> to review your application status.</p>
      <p>Good luck!<br>The TrustBee Team</p>
    `,
    text: `Great news, ${data.jobSeekerFirstName}!\n\n${data.companyName} wants to interview you for ${data.jobTitle}.\n\nThey will contact you soon to arrange details.\n\nGood luck!\nThe TrustBee Team`,
  });
}

export async function sendInterviewBookedToRecruiter(data: {
  recruiterEmail: string;
  companyName: string;
  jobSeekerFirstName: string;
  jobSeekerLastName: string;
  jobSeekerEmail: string;
  jobSeekerPhone?: string;
  jobTitle: string;
}) {
  if (!emailEnabled) {
    console.log(`[mailer disabled] Interview confirmation for recruiter ${data.recruiterEmail}`);
    return;
  }
  return mailer.sendMail({
    from: `"TrustBee" <${process.env.ADMIN_EMAIL}>`,
    to: data.recruiterEmail,
    subject: `Interview booked — ${data.jobSeekerFirstName} ${data.jobSeekerLastName} for ${data.jobTitle}`,
    html: `
      <h2>Interview Booking Confirmed</h2>
      <p>You have booked an interview with <strong>${data.jobSeekerFirstName} ${data.jobSeekerLastName}</strong> for the position of <strong>${data.jobTitle}</strong>.</p>
      <p>Candidate contact details:</p>
      <ul>
        <li>Email: <a href="mailto:${data.jobSeekerEmail}">${data.jobSeekerEmail}</a></li>
        ${data.jobSeekerPhone ? `<li>Phone: ${data.jobSeekerPhone}</li>` : ""}
      </ul>
      <p>Please reach out to arrange the interview schedule.</p>
      <p>Best regards,<br>The TrustBee Team</p>
    `,
    text: `Interview booked with ${data.jobSeekerFirstName} ${data.jobSeekerLastName} for ${data.jobTitle}.\n\nCandidate email: ${data.jobSeekerEmail}\n${data.jobSeekerPhone ? `Phone: ${data.jobSeekerPhone}\n` : ""}\nPlease contact them to arrange the schedule.\n\nThe TrustBee Team`,
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
