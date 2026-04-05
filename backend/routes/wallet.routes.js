import express from "express";
import { getWallet, addMoney } from "../controllers/wallet.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getWallet);
router.post("/add", protect, addMoney);

export default router;