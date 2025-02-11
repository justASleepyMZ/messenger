const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const http = require('http');
const socketIo = require('socket.io');
const Message = require('./models/Message'); // Импортируем модель сообщений
const cors = require('cors'); // Подключаем CORS для поддержки разных доменов
const authRoutes = require('./controllers/authController'); // Путь к маршрутам
const authMiddleware = require('./middleware/authMiddleware');
const privateMessagesRouter = require("./routes/privateMessages");
const nodemailer = require("nodemailer");
require("dotenv").config();


dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);


// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(cors({
  origin: "*",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

let verificationCodes = {}; // Временное хранилище кодов

app.use("/api/private-messages", privateMessagesRouter);
app.use("/auth", authRoutes);

// Подключение к базе данных MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// Генерация JWT токена
const generateToken = (id, username) => {
  return jwt.sign({ id, username }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

app.post("/send-verification-code", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required!" });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes[email] = code;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Verification Code",
    text: `Your verification code: ${code}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) return res.status(500).json({ error: "Failed to send email!" });
    res.json({ message: "Code sent successfully!" });
  });
});

app.post("/verify-code", (req, res) => {
  console.log("Полученный запрос:", req.body);
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: "Email и код обязательны!" });
  }

  if (verificationCodes[email] === code) {
    delete verificationCodes[email];
    return res.json({ message: "Email verified!" });
  } else {
    return res.status(400).json({ error: "Неверный или истёкший код!" });
  }
});

// Роут для регистрации
app.post("/register", async (req, res) => {
  console.log("Полученные данные:", req.body); // Должно вывести username, email и password
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email и пароль обязательны!" });
  }

  try {
      const user = new User({ username, email, password });
      await user.save();
      res.json({ message: "Пользователь зарегистрирован!" });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Ошибка регистрации" });
  }
});

// Роут для логина
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user || !(await user.matchPassword(password))) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(user._id, user.username);
  res.json({ token });
});

// Роут смены пароля 
app.post('/api/users/change-password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Неверный старый пароль' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Пароль успешно изменён' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Роут удаление аккаунта
app.post('/api/users/change-password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Неверный старый пароль" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Пароль успешно изменён" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

app.delete('/api/users/delete', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    res.json({ message: "Аккаунт успешно удалён" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Middleware для защиты роутов
const protect = (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Not authorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Not authorized' });
  }
};

// Роут для получения сообщений
app.get('/messages', protect, async (req, res) => {
  const messages = await Message.find().sort({ timestamp: 1 }).limit(20); // Ограничиваем вывод последних 20 сообщений
  res.json(messages);
});

// Роут для отправки сообщения в чат
app.post('/messages', protect, async (req, res) => {
  const { message } = req.body;
  const sender = req.user.id;

  const newMessage = new Message({
    sender,
    message,
    timestamp: new Date(),
  });

  const authRoutes = require("./controllers/authController");
  app.use("/auth", authRoutes);

  

  // Сохраняем сообщение в базе данных
  await newMessage.save();
  res.status(201).json({ message: 'Message sent' });
});

// Чат функциональность через WebSocket
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Глобальный чат
  socket.on("getOldMessages", async () => {
      try {
          const messages = await Message.find().sort({ timestamp: 1 }).limit(20);
          socket.emit("loadMessages", messages);
      } catch (err) {
          console.error("Error loading messages:", err);
      }
  });

  socket.on("chatMessage", async (data) => {
      console.log(`Received message: ${data.message} from ${data.sender}`);
      const newMessage = new Message({
          sender: data.sender,
          message: data.message,
          timestamp: new Date(),
      });

      try {
          await newMessage.save();
          io.emit("chatMessage", {
              sender: data.sender,
              message: data.message,
              timestamp: newMessage.timestamp,
          });
      } catch (err) {
          console.error("Error saving message:", err);
      }
  });

  // **Приватные сообщения**
  socket.on("privateMessage", async ({ to, from, content }) => {
      try {
          const newMessage = new PrivateMessage({
              sender: from,
              receiver: to,
              content,
              timestamp: new Date(),
          });

          await newMessage.save();

          // Отправляем сообщение только получателю
          io.to(to).emit("privateMessage", {
              sender: from,
              content,
              timestamp: newMessage.timestamp,
          });

          // Отправляем отправителю подтверждение отправки
          socket.emit("privateMessage", {
              sender: from,
              content,
              timestamp: newMessage.timestamp,
          });

      } catch (err) {
          console.error("Error sending private message:", err);
      }
  });

  socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
  });
});


// Запуск сервера
server.listen(process.env.PORT || 5000, () => {
  const host = process.env.HOST || 'localhost';
  const port = process.env.PORT || 5000;
  console.log(`Server running at http://${host}:${port}`);
});
