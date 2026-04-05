import mongoose from "mongoose";

const earningSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    surgeMultiplier: {
      type: Number,
      default: 1.0,
    },
    baseAmount: {
      type: Number,
      required: true,
    },
    distance: Number,
    date: {
      type: Date,
      default: Date.now,
    },
    week: Number,   // ISO week number
    month: Number,  // 1-12
    year: Number,
  },
  { timestamps: true }
);

// Auto-set week/month/year before save
earningSchema.pre("save", function (next) {
  const d = new Date(this.date);
  this.month = d.getMonth() + 1;
  this.year = d.getFullYear();

  // ISO week
  const startOfYear = new Date(this.year, 0, 1);
  this.week = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);

  next();
});

export default mongoose.model("Earning", earningSchema);