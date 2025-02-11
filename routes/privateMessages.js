const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

// Пример маршрута для приватных сообщений
router.get("/", auth, (req, res) => {
  res.send("Приватные сообщения работают!");
});

module.exports = router;
