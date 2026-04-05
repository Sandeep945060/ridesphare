import Wallet from "../models/Wallet.js";

/* ─── Ensure wallet exists ─── */
const ensureWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) wallet = await Wallet.create({ user: userId, balance: 0 });
  return wallet;
};

/* ═══════════════════════════════════════════
   GET WALLET
═══════════════════════════════════════════ */
export const getWallet = async (req, res) => {
  try {
    const wallet = await ensureWallet(req.user.id);
    res.json({
      balance: wallet.balance,
      transactions: wallet.transactions.slice(-20).reverse(), // last 20
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════
   ADD MONEY (Top-up - mock for now)
═══════════════════════════════════════════ */
export const addMoney = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount" });
    if (amount > 10000) return res.status(400).json({ message: "Max ₹10,000 per top-up" });

    const wallet = await ensureWallet(req.user.id);
    wallet.balance += amount;
    wallet.transactions.push({
      type: "credit",
      amount,
      description: "Wallet top-up",
    });
    await wallet.save();

    res.json({ message: "Money added", balance: wallet.balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════
   DEDUCT FARE FROM RIDER WALLET (called on complete)
═══════════════════════════════════════════ */
export const deductFare = async (userId, fare, rideId, description) => {
  try {
    const wallet = await ensureWallet(userId);
    if (wallet.balance < fare) return false; // insufficient

    wallet.balance -= fare;
    wallet.transactions.push({
      type: "debit",
      amount: fare,
      description,
      ride: rideId,
    });
    await wallet.save();
    return true;
  } catch {
    return false;
  }
};