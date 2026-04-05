import express from "express";
import {
  createRide,
  acceptRide,
  rejectRide,
  markArrived,
  verifyOTP,
  completeRide,
  cancelRide,
  getMyLatestRide,
  getMyRides,
  getLatestRide,
  getSurgeInfo,
  getDriverETA,
} from "../controllers/ride.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Rider
router.post("/create",          protect, createRide);
router.get("/my-rides",         protect, getMyRides);
router.get("/my-latest",        protect, getMyLatestRide);
router.put("/cancel/:id",       protect, cancelRide);
router.get("/surge",                     getSurgeInfo);
router.get("/eta/:rideId",      protect, getDriverETA);

// Driver
router.get("/latest",           protect, getLatestRide);
router.put("/accept/:id",       protect, acceptRide);
router.put("/reject/:id",       protect, rejectRide);
router.put("/arrived/:id",      protect, markArrived);
router.put("/verify-otp/:id",   protect, verifyOTP);
router.put("/complete/:id",     protect, completeRide);

export default router;