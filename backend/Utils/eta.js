/**
 * ETA CALCULATOR
 * Calculates driver ETA to pickup point
 */

const EARTH_RADIUS_KM = 6371;

// Average speeds by time of day (km/h)
const getAvgSpeed = (hour = new Date().getHours()) => {
  if (hour >= 8 && hour <= 10) return 18;   // Morning rush
  if (hour >= 17 && hour <= 20) return 15;  // Evening rush
  if (hour >= 23 || hour <= 5) return 40;   // Night - fast
  return 28;                                 // Normal
};

/**
 * Haversine distance between two coordinates (km)
 */
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (x) => (x * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Calculate ETA in minutes from driver to pickup
 * @param {number} driverLat
 * @param {number} driverLng
 * @param {number} pickupLat
 * @param {number} pickupLng
 * @returns {{ distanceKm: number, etaMinutes: number, etaText: string }}
 */
export const calculateETA = (driverLat, driverLng, pickupLat, pickupLng) => {
  const hour = new Date().getHours();
  const speed = getAvgSpeed(hour);

  const distanceKm = haversineDistance(driverLat, driverLng, pickupLat, pickupLng);
  const etaMinutes = Math.ceil((distanceKm / speed) * 60);

  let etaText;
  if (etaMinutes < 1) etaText = "< 1 min";
  else if (etaMinutes === 1) etaText = "1 min";
  else etaText = `${etaMinutes} mins`;

  return {
    distanceKm: parseFloat(distanceKm.toFixed(2)),
    etaMinutes,
    etaText,
  };
};

/**
 * Find nearest available drivers from pickup point
 * @param {{ lat, lng, userId, socketId }[]} drivers - online drivers array
 * @param {number} pickupLat
 * @param {number} pickupLng
 * @param {number} radiusKm - max search radius
 * @returns sorted array of nearby drivers with ETA
 */
export const findNearbyDrivers = (drivers, pickupLat, pickupLng, radiusKm = 10) => {
  return drivers
    .map((driver) => {
      const eta = calculateETA(driver.lat, driver.lng, pickupLat, pickupLng);
      return { ...driver, ...eta };
    })
    .filter((d) => d.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm); // nearest first
};