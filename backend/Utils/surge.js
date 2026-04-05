// ================= SURGE TIERS =================
const SURGE_TIERS = [
  { min: 0, max: 1, multiplier: 1, label: "Normal" },
  { min: 1, max: 1.5, multiplier: 1.2, label: "Busy" },
  { min: 1.5, max: 2, multiplier: 1.5, label: "High Demand" },
  { min: 2, max: 100, multiplier: 2, label: "Peak Time 🔥" },
];

// ================= GET SURGE =================
export const getSurgeMultiplier = (
  activeRides,
  onlineDrivers,
  hour = new Date().getHours()
) => {
  try {
    // 🔹 Demand vs Supply
    const ratio =
      onlineDrivers === 0 ? 2 : activeRides / onlineDrivers;

    // 🔹 Peak hours (8-10 AM, 5-8 PM)
    const isPeak =
      (hour >= 8 && hour <= 10) ||
      (hour >= 17 && hour <= 20);

    const adjustedRatio = isPeak ? ratio * 1.2 : ratio;

    // 🔹 Find correct tier
    const tier =
      SURGE_TIERS.find(
        (t) =>
          adjustedRatio >= t.min &&
          adjustedRatio < t.max
      ) || SURGE_TIERS[SURGE_TIERS.length - 1];

    return {
      multiplier: tier.multiplier,
      label: tier.label,
      ratio: Number(adjustedRatio.toFixed(2)),
      isPeak,
    };
  } catch (err) {
    console.log("❌ SURGE ERROR:", err);

    // fallback
    return {
      multiplier: 1,
      label: "Normal",
      ratio: 1,
      isPeak: false,
    };
  }
};

// ================= APPLY SURGE =================
export const applySurge = (baseFare, multiplier) => {
  try {
    if (!baseFare || !multiplier) return baseFare || 0;

    return Number((baseFare * multiplier).toFixed(2));
  } catch (err) {
    console.log("❌ APPLY SURGE ERROR:", err);
    return baseFare || 0;
  }
};