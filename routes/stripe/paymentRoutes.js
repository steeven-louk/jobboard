const express = require("express");
// const Webhook = require("../../controllers/stripe/webhook");
const { verifyToken, verifyRole } = require("../../middlewares/auth");
const CheckoutPage = require("../../controllers/stripe/checkout");
const paymentRouter = express.Router();

paymentRouter.post("/create-checkout-session",verifyToken,verifyRole(['ADMIN','RECRUITER']),CheckoutPage)

module.exports = paymentRouter;