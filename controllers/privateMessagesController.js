const PrivateMessage = require("../models/PrivateMessage");

exports.sendPrivateMessage = async (req, res) => {
    try {
        const { sender, receiver, message } = req.body;

        if (!sender || !receiver || !message) {
            return res.status(400).json({ error: "Все поля обязательны" });
        }

        const newMessage = new PrivateMessage({ sender, receiver, message });
        await newMessage.save();

        res.status(201).json({ message: "Сообщение отправлено", data: newMessage });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
};
