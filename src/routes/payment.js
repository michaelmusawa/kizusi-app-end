import express from "express";
import {
  initiatePayment,
  handlePaymentCallback,
  // checkPaymentStatus,
} from "../controllers/paymentController.js";

const paymentRouter = express.Router();

// Initiate a payment
paymentRouter.post("/initiate", initiatePayment);

// Handle payment callback/notification
paymentRouter.post("/callback", handlePaymentCallback);

// Check payment status
//paymentRouter.get("/status/:transactionId", checkPaymentStatus);

export default paymentRouter;
