const Message = require("../models/Message");

const router = require("express").Router();

router.get("/", async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error("Error loading messages:", err);
    res.status(500).json({ error: "Error loading messages" });
  }
});

module.exports = router; // Экспортируем сам router
