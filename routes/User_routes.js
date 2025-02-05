const express = require("express");
const { verifyToken } = require("../middlewares/auth");
const { getProfil, updateProfile, updateExperience, updateDiplome, addExperience } = require("../controllers/UserController");

const userRouter = express.Router();

userRouter.get("/profil",verifyToken,getProfil);
userRouter.put("/profil/update",verifyToken,updateProfile);
userRouter.put("/profil/experience/:id",verifyToken,updateExperience);
userRouter.post("/profil/experience",verifyToken,addExperience);
userRouter.put("/profil/diplome/:id",verifyToken,updateDiplome);
// userRouter.post("/register", Register);

module.exports = userRouter;