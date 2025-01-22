const express = require("express");
const { verifyToken } = require("../middlewares/auth");
const { Login, Register } = require("../controllers/AuthController");

const authRouter = express.Router();

authRouter.post("/login",Login);
authRouter.post("/register", Register);

module.exports = authRouter;