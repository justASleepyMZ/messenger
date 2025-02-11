const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // Или другой почтовый сервис
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendVerificationEmail(email, code) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Подтверждение регистрации",
    text: `Ваш код подтверждения: ${code}`
  };
  await transporter.sendMail(mailOptions);
}

module.exports = sendVerificationEmail;
