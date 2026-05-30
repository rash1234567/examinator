import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "localhost", // for Mailpit
  port: 1025,
  secure: false,
});

async function testEmail() {
  await transporter.sendMail({
    from: "test@examinator.com",
    to: "user@test.com",
    subject: "Test Email",
    html: "<h1>Hello from Examinator 🚀</h1>",
  });

  console.log("Email sent!");
}

testEmail();