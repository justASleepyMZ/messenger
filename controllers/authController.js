const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const router = express.Router();
const jwt = require("jsonwebtoken");
const authMiddleware = require('../middleware/authMiddleware'); // Импортируем middleware
const crypto = require("crypto");
const sendVerificationEmail = require("../middleware/emailService");
const nodemailer = require("nodemailer");

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Настраиваем почтовый сервис
const transporter = nodemailer.createTransport({
  service: "gmail", // Или другой SMTP (Mailgun, SendGrid, Yandex)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 📌 **Регистрация пользователя**
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateCode(); // Генерируем 6-значный код

    const newUser = new User({ username, email, password: hashedPassword, verificationCode });
    await newUser.save();

    // Отправляем код на email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify your account",
      text: `Your verification code is: ${verificationCode}`
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error("Email error:", error);
        return res.status(500).json({ error: "Error sending email" });
      }
      res.json({ success: true, message: "Verification code sent to email" });
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "An error occurred during registration" });
  }
});

// 📌 **Подтверждение кода**
router.post("/verify", async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || user.verificationCode !== code) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    user.isVerified = true;
    user.verificationCode = null;
    await user.save();

    res.json({ success: true, message: "Account verified successfully" });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 📌 **Логин (только если верифицирован)**
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(400).json({ error: "Account not verified. Check your email." });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ success: true, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Смена пароля
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Проверяем старый пароль
    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) return res.status(400).json({ error: 'Incorrect old password' });

    // Хешируем новый пароль
    user.password = await bcrypt.hash(newPassword, 10);

    // Сохраняем изменения
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Удаление аккаунта
router.delete('/delete-account', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { password } = req.body;
    
    // Проверяем, что пароль правильный
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ error: 'Incorrect password' });

    // Удаляем пользователя
    await User.findByIdAndDelete(req.user.id);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Пример использования middleware в маршруте
router.put('/change-password', authMiddleware, async (req, res) => {
  // Код для смены пароля
});

module.exports = router;