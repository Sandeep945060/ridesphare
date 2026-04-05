import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
    },
    ratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ratedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      maxlength: 200,
    },
    type: {
      type: String,
      enum: ["rider-to-driver", "driver-to-rider"],
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate ratings for same ride
ratingSchema.index({ ride: 1, ratedBy: 1 }, { unique: true });

export default mongoose.model("Rating", ratingSchema);