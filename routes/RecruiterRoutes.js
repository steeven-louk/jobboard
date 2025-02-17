const express = require("express");
// const { createRecruiter, addJobOffer } = require("../controllers/recruiterController");
// const { authenticateUser } = require("../middlewares/authMiddleware");
const { createRecruiter } = require("../controllers/RecruteurController");

const recruterRoute = express.Router();

recruterRoute.post("/register-recruiter", createRecruiter); // Inscription avec création d'entreprise
// router.post("/add-job", authenticateUser, addJobOffer); // Ajout d'une offre (Recruteur uniquement)

module.exports = recruterRoute;
