export const verificationEmailTemplate = (name: string, link: string) => {
  return `
  <div style="font-family: Arial, sans-serif; background-color: #f6f8fb; padding: 40px;">
    <div style="max-width: 600px; margin: auto; background: white; border-radius: 12px; padding: 30px; text-align: center;">

      <h2 style="color: #2b2d42;">Welcome to Examinator 🎓</h2>

      <p style="font-size: 16px; color: #555;">
        Hi <b>${name}</b>, please verify your email to activate your account.
      </p>

      <p style="margin: 30px 0;">
        Click the button below to verify your email:
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
        Verify Email
      </a>

      <p style="margin-top: 30px; font-size: 12px; color: #888;">
        If you didn’t create this account, you can ignore this email.
      </p>

      <hr style="margin: 30px 0;" />

      <p style="font-size: 12px; color: #aaa;">
        Examinator - Smart Exam Management System
      </p>

    </div>
  </div>
  `;
};