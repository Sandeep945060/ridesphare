// ════════════════════════════════════════
// routes/earning.routes.js
// ════════════════════════════════════════
import express from "express";
import { getDriverEarnings, getLiveEarnings } from "../controllers/earning.controller.js";
import { protect } from "../middleware/auth.middleware.js"; // your existing auth middleware

const router = express.Router();

router.get("/summary", protect, getDriverEarnings);
router.get("/live", protect, getLiveEarnings);

export default router;