// controllers/payment.controller.js
import Razorpay from "razorpay";
import crypto from "crypto";
import Wallet from "../models/Wallet.js";
import Ride from "../models/Ride.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_SZfMENUF13QcgR",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "YOUR_RAZORPAY_SECRET",
});

/* ─── Ensure wallet exists ─── */
const ensureWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) wallet = await Wallet.create({ user: userId, balance: 0, transactions: [] });
  return wallet;
};

/* ═══════════════════════════════════════════
   CREATE ORDER  (Razorpay)
   POST /api/payment/create-order
═══════════════════════════════════════════ */
export const createOrder = async (req, res) => {
  try {
    const { amount, rideId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // Amount in paise (₹1 = 100 paise)
    const amountInPaise = Math.round(amount * 100);

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `ride_${rideId}_${Date.now()}`,
      notes: {
        rideId: rideId?.toString(),
        userId: req.user.id,
      },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error("❌ Razorpay order error:", err);
    res.status(500).json({ message: "Failed to create payment order" });
  }
};

/* ═══════════════════════════════════════════
   VERIFY PAYMENT  (Razorpay signature check)
   POST /api/payment/verify
═══════════════════════════════════════════ */
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      rideId,
      amount,
    } = req.body;

    // ── Verify signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "YOUR_RAZORPAY_SECRET";
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSig = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed — invalid signature" });
    }

    // ── Mark ride as paid
    await Ride.findByIdAndUpdate(rideId, {
      paymentStatus: "paid",
      paymentMethod: "razorpay",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });

    // ── Add transaction to rider wallet (record only, no balance change for Razorpay)
    const wallet = await ensureWallet(req.user.id);
    wallet.transactions.push({
      type: "debit",
      amount,
      description: `Razorpay payment for ride`,
      ride: rideId,
    });
    await wallet.save();

    res.json({ message: "Payment verified successfully", paymentId: razorpay_payment_id });
  } catch (err) {
    console.error("❌ Verify error:", err);
    res.status(500).json({ message: "Payment verification error" });
  }
};

/* ═══════════════════════════════════════════
   DEDUCT WALLET  (for wallet payments)
   POST /api/wallet/deduct
═══════════════════════════════════════════ */
export const deductWallet = async (req, res) => {
  try {
    const { amount, rideId, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const wallet = await ensureWallet(req.user.id);

    if (wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    wallet.balance -= amount;
    wallet.transactions.push({
      type: "debit",
      amount,
      description: description || "Ride payment",
      ride: rideId,
    });
    await wallet.save();

    // Mark ride as paid
    if (rideId) {
      await Ride.findByIdAndUpdate(rideId, {
        paymentStatus: "paid",
        paymentMethod: "wallet",
      });
    }

    res.json({
      message: "Wallet payment successful",
      balance: wallet.balance,
    });
  } catch (err) {
    console.error("❌ Wallet deduct error:", err);
    res.status(500).json({ message: "Wallet payment failed" });
  }
};

/* ═══════════════════════════════════════════
   GET PAYMENT STATUS  (for a ride)
   GET /api/payment/status/:rideId
═══════════════════════════════════════════ */
export const getPaymentStatus = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId).select("paymentStatus paymentMethod fare");
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    res.json({
      paymentStatus: ride.paymentStatus || "pending",
      paymentMethod: ride.paymentMethod,
      fare: ride.fare,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};