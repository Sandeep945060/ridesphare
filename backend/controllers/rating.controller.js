import Rating from "../models/Rating.js";
import User from "../models/User.js";
import Ride from "../models/Ride.js";

/* ═══════════════════════════════════════════
   SUBMIT RATING
═══════════════════════════════════════════ */
export const submitRating = async (req, res) => {
  try {
    const { rideId, rating, comment, type } = req.body;
    // type: "rider-to-driver" or "driver-to-rider"

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    if (ride.status !== "completed") return res.status(400).json({ message: "Ride not completed" });

    const ratedTo =
      type === "rider-to-driver" ? ride.driver : ride.rider;

    // Create rating (unique per ride per user)
    const newRating = await Rating.create({
      ride: rideId,
      ratedBy: req.user.id,
      ratedTo,
      rating,
      comment,
      type,
    });

    // ── Update avg rating on User model
    const allRatings = await Rating.find({ ratedTo });
    const avg =
      allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length;

    await User.findByIdAndUpdate(ratedTo, {
      avgRating: parseFloat(avg.toFixed(1)),
      totalRatings: allRatings.length,
    });

    res.json({ message: "Rating submitted", rating: newRating });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Already rated this ride" });
    }
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════
   GET DRIVER RATING STATS
═══════════════════════════════════════════ */
export const getDriverRatings = async (req, res) => {
  try {
    const { driverId } = req.params;

    const ratings = await Rating.find({ ratedTo: driverId, type: "rider-to-driver" })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("ratedBy", "name");

    const avg =
      ratings.length > 0
        ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
        : 0;

    // Breakdown: count per star
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach((r) => breakdown[r.rating]++);

    res.json({
      avg: parseFloat(avg.toFixed(1)),
      total: ratings.length,
      breakdown,
      recent: ratings.slice(0, 5),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};