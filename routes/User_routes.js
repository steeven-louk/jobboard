const express = require("express");
const { verifyToken } = require("../middlewares/auth");
const { getProfil } = require("../controllers/UserController");

const userRouter = express.Router();

userRouter.get("/profil",verifyToken,getProfil);
// userRouter.post("/register", Register);

module.exports = userRouter;