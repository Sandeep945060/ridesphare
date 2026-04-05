import Earning from "../models/Earning.js";
import Ride from "../models/Ride.js";

/* ═══════════════════════════════════════════
   GET DRIVER EARNINGS SUMMARY
   Returns: today, week, month totals + chart data
═══════════════════════════════════════════ */
export const getDriverEarnings = async (req, res) => {
  try {
    const driverId = req.user.id;
    const now = new Date();

    // ── Today boundaries
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // ── Week boundaries (Mon-Sun)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);

    // ── Month boundaries
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // ── All earnings for this driver
    const allEarnings = await Earning.find({ driver: driverId }).sort({ date: -1 });

    // ── Today
    const todayEarnings = allEarnings.filter((e) => new Date(e.date) >= todayStart);
    const todayTotal = todayEarnings.reduce((s, e) => s + e.amount, 0);
    const todayRides = todayEarnings.length;

    // ── This Week
    const weekEarnings = allEarnings.filter((e) => new Date(e.date) >= weekStart);
    const weekTotal = weekEarnings.reduce((s, e) => s + e.amount, 0);

    // ── This Month
    const monthEarnings = allEarnings.filter((e) => new Date(e.date) >= monthStart);
    const monthTotal = monthEarnings.reduce((s, e) => s + e.amount, 0);

    // ── Last 7 days chart data
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const nextD = new Date(d);
      nextD.setDate(d.getDate() + 1);

      const dayEarnings = allEarnings.filter((e) => {
        const ed = new Date(e.date);
        return ed >= d && ed < nextD;
      });

      last7Days.push({
        label: d.toLocaleDateString("en-IN", { weekday: "short" }),
        amount: parseFloat(dayEarnings.reduce((s, e) => s + e.amount, 0).toFixed(0)),
        rides: dayEarnings.length,
      });
    }

    // ── Recent rides list
    const recentRides = allEarnings.slice(0, 10).map((e) => ({
      id: e._id,
      amount: e.amount,
      surgeMultiplier: e.surgeMultiplier,
      distance: e.distance,
      date: e.date,
    }));

    // ── Average rating
    const completedRides = await Ride.countDocuments({
      driver: driverId,
      status: "completed",
    });

    res.json({
      today: { total: parseFloat(todayTotal.toFixed(0)), rides: todayRides },
      week: { total: parseFloat(weekTotal.toFixed(0)) },
      month: { total: parseFloat(monthTotal.toFixed(0)) },
      last7Days,
      recentRides,
      totalRides: completedRides,
    });
  } catch (err) {
    console.log("❌ EARNINGS ERROR:", err);
    res.status(500).json({ message: "Earnings fetch error" });
  }
};

/* ═══════════════════════════════════════════
   GET LIVE EARNINGS (For real-time update)
═══════════════════════════════════════════ */
export const getLiveEarnings = async (req, res) => {
  try {
    const driverId = req.user.id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEarnings = await Earning.find({
      driver: driverId,
      date: { $gte: todayStart },
    });

    const total = todayEarnings.reduce((s, e) => s + e.amount, 0);

    res.json({
      total: parseFloat(total.toFixed(0)),
      rides: todayEarnings.length,
    });
  } catch (err) {
    res.status(500).json({ message: "Live earnings error" });
  }
};