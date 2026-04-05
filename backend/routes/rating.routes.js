import express from "express";
import { submitRating, getDriverRatings } from "../controllers/rating.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/submit", protect, submitRating);
router.get("/driver/:driverId", getDriverRatings);

export default router;