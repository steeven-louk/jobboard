const express = require("express");
const Webhook = require("../../controllers/stripe/webhook");
const { verifyToken, verifyRole } = require("../../middlewares/auth");

const webhookRouter = express.Router();

webhookRouter.post("/webhook", express.raw({type:"application/json"}),verifyToken,verifyRole(['ADMIN','RECRUITER']), Webhook)

module.exports = webhookRouter;