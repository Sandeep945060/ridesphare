import mongoose from "mongoose";

const driverSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  licenseNumber: String,
  vehicleNumber: String,
  vehicleType: String,

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"], // ✅ FIXED
    default: "pending"
  }

}, { timestamps: true });

export default mongoose.model("Driver", driverSchema);