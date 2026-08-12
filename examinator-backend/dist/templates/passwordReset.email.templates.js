"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordResetEmailTemplate = void 0;
const passwordResetEmailTemplate = (name, link) => {
    return `
  <div style="font-family: Arial, sans-serif; background-color: #f6f8fb; padding: 40px;">
    <div style="max-width: 600px; margin: auto; background: white; border-radius: 12px; padding: 30px; text-align: center;">

      <h2 style="color: #2b2d42;">Reset your password</h2>

      <p style="font-size: 16px; color: #555;">
        Hi <b>${name}</b>, we received a request to reset your Examinator password.
      </p>

      <p style="margin: 30px 0;">
        Click the button below to choose a new password. This link expires in 1 hour.
      </p>

      <a href="${link}"
         style="
          background-color: #4f46e5;
          color: white;
          padding: 14px 24px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          display: inline-block;
         ">
        Reset Password
      </a>

      <p style="margin-top: 30px; font-size: 12px; color: #888;">
        If you did not request this, you can ignore this email. Your password will not change.
      </p>

      <hr style="margin: 30px 0;" />

      <p style="font-size: 12px; color: #aaa;">
        Examinator - Smart Exam Management System
      </p>

    </div>
  </div>
  `;
};
exports.passwordResetEmailTemplate = passwordResetEmailTemplate;
