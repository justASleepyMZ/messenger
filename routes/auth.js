const express = require("express");
const { register, verifyCode } = require("../controllers/authController");
const router = express.Router();

router.post("/register", register);
router.post("/verify", verifyCode);

module.exports = router;
