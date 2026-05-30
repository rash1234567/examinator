import nodemailer from "nodemailer";
import { verificationEmailTemplate } from "../templates/verification.email.templates";
import { passwordResetEmailTemplate } from "../templates/passwordReset.email.templates";


const transporter = nodemailer.createTransport({
  host: "localhost", // Mailpit or SMTP
  port: 1025,
  secure: false,
});


export async function sendVerificationEmail(
  email: string,
  name: string,
  link: string
) {
  await transporter.sendMail({
    from: "examinator@system.com",
    to: email,
    subject: "Verify your email",
    html: verificationEmailTemplate(name, link),
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  link: string
) {
  await transporter.sendMail({
    from: "examinator@system.com",
    to: email,
    subject: "Reset your password",
    html: passwordResetEmailTemplate(name, link),
  });
}

