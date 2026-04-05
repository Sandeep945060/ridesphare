// routes/payment.routes.js
import express from "express";
import {
  createOrder,
  verifyPayment,
  deductWallet,
  getPaymentStatus,
} from "../controllers/Payment.controller.jsx";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/create-order", protect, createOrder);
router.post("/verify", protect, verifyPayment);
router.get("/status/:rideId", protect, getPaymentStatus);

// Also expose wallet deduct via wallet route
// Add to wallet.routes.js: router.post("/deduct", protect, deductWallet);
// OR add here and mount at /api/wallet/deduct:
router.post("/wallet-deduct", protect, deductWallet);

export default router;