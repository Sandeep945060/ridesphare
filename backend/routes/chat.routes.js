import express from "express";
import { sendMessage, getMessages, markRead } from "../controllers/chat.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/send", protect, sendMessage);
router.get("/:rideId", protect, getMessages);
router.put("/read/:rideId", protect, markRead);

export default router;