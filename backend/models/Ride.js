import mongoose from "mongoose";

const rideSchema = new mongoose.Schema(
  {
    rider: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    pickup: String,
    drop: String,

    distance: Number,
    fare: Number,

    // 🔐 ADD THIS
    otp: {
      type: String,
    },
    baseFare: Number,
surgeMultiplier: { type: Number, default: 1 },
surgeLabel: String,
pickupLat: Number,
pickupLng: Number,
startedAt: Date,
completedAt: Date,

    status: {
      type: String,
      enum: ["searching", "accepted", "arrived", "ongoing", "completed", "cancelled"],
      default: "searching",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Ride", rideSchema);