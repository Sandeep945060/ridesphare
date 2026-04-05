// import Ride from "../models/Ride.js";
// import { io, onlineDrivers, driverSockets, userSockets } from "../server.js";
// import axios from "axios"; // 🔥 ADD

// /* ================= SEND SMS OTP ================= */
// const sendOTP = async (phone, otp) => {
//   try {
//     await axios.get("https://www.fast2sms.com/dev/bulkV2", {
//       params: {
//         authorization: process.env.FAST2SMS_API_KEY,
//         route: "otp",
//         variables_values: otp,
//         flash: "0",
//         numbers: phone,
//       },
//     });

//     console.log("📲 OTP SENT TO:", phone);
//   } catch (err) {
//     console.log("❌ SMS ERROR:", err.response?.data || err.message);
//   }
// };

// /* ================= CREATE RIDE ================= */
// export const createRide = async (req, res) => {
//   try {
//     const { pickup, drop, distance, fare, pickupCoords } = req.body;

//     const ride = await Ride.create({
//       rider: req.user.id,
//       pickup,
//       drop,
//       distance,
//       fare,
//       status: "searching",
//     });

//     Object.entries(onlineDrivers).forEach(([socketId, driver]) => {
//       const dist = getDistance(
//         pickupCoords.lat,
//         pickupCoords.lng,
//         driver.lat,
//         driver.lng
//       );

//       if (dist <= 50) {
//         io.to(socketId).emit("new-ride", ride);
//       }
//     });

//     res.json(ride);
//   } catch (err) {
//     console.log("❌ CREATE ERROR:", err);
//     res.status(500).json({ message: "Create ride error" });
//   }
// };

// /* ================= DRIVER: GET LATEST ================= */
// export const getLatestRide = async (req, res) => {
//   try {
//     const ride = await Ride.findOne({ status: "searching" })
//       .populate("rider", "name phone");

//     res.json(ride);
//   } catch (err) {
//     res.status(500).json({ message: "Error fetching ride" });
//   }
// };

// /* ================= ACCEPT RIDE ================= */
// export const acceptRide = async (req, res) => {
//   try {
//     const ride = await Ride.findOneAndUpdate(
//       { _id: req.params.id, status: "searching" },
//       {
//         driver: req.user.id,
//         status: "accepted",
//       },
//       { new: true }
//     )
//       .populate("driver", "name")
//       .populate("rider", "name phone");

//     if (!ride) {
//       return res.status(400).json({ message: "Ride not found" });
//     }

//     const riderSocket = userSockets?.[ride.rider._id.toString()];
//     if (riderSocket) {
//       io.to(riderSocket).emit("ride-accepted", ride);
//     }

//     res.json(ride);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// /* ================= RIDER: ALL RIDES ================= */
// export const getMyRides = async (req, res) => {
//   try {
//     const rides = await Ride.find({ rider: req.user.id })
//       .sort({ createdAt: -1 });

//     res.json(rides);
//   } catch (err) {
//     res.status(500).json({ message: "Error fetching rides" });
//   }
// };

// /* ================= RIDER: LATEST ================= */
// export const getMyLatestRide = async (req, res) => {
//   try {
//     const ride = await Ride.findOne({ rider: req.user.id })
//       .sort({ createdAt: -1 })
//       .populate("driver", "name");

//     res.json(ride);
//   } catch (err) {
//     res.status(500).json({ message: "Error fetching latest ride" });
//   }
// };

// /* ================= COMPLETE RIDE ================= */
// export const completeRide = async (req, res) => {
//   try {
//     const ride = await Ride.findByIdAndUpdate(
//       req.params.id,
//       { status: "completed" },
//       { new: true }
//     ).populate("rider", "name");

//     // 🔥 Rider ko turant batao ride complete hui
//     const riderSocket = userSockets?.[ride.rider._id.toString()];
//     if (riderSocket) {
//       io.to(riderSocket).emit("ride-completed", ride);
//     }

//     res.json(ride);
//   } catch (err) {
//     res.status(500).json({ message: "Complete error" });
//   }
// };

// /* ================= CANCEL RIDE ================= */
// export const cancelRide = async (req, res) => {
//   try {
//     const ride = await Ride.findByIdAndUpdate(
//       req.params.id,
//       { status: "cancelled" },
//       { new: true }
//     );

//     io.emit("ride-cancelled", ride._id);

//     res.json(ride);
//   } catch (err) {
//     res.status(500).json({ message: "Cancel error" });
//   }
// };

// /* ================= ARRIVED ================= */
// export const markArrived = async (req, res) => {
//   try {
//     const ride = await Ride.findById(req.params.id)
//       .populate("rider", "phone");

//     if (!ride) {
//       return res.status(404).json({ message: "Ride not found" });
//     }

//     const otp = Math.floor(1000 + Math.random() * 9000).toString();

//     ride.status = "arrived";
//     ride.otp = otp;

//     await ride.save();

//     if (ride.rider?.phone) {
//       await sendOTP(ride.rider.phone, otp);
//     }

//     const riderId = ride.rider._id.toString();
//     const riderSocket = userSockets?.[riderId];

//     if (riderSocket) {
//       io.to(riderSocket).emit("otp-generated", { otp });
//     }

//     res.json(ride);
//   } catch (err) {
//     console.log("❌ ARRIVED ERROR:", err);
//     res.status(500).json({ message: "Arrived error" });
//   }
// };

// /* ================= VERIFY OTP ================= */
// export const verifyOTP = async (req, res) => {
//   try {
//     const { otp } = req.body;

//     const ride = await Ride.findById(req.params.id);

//     if (!ride) {
//       return res.status(404).json({ message: "Ride not found" });
//     }

//     if (ride.otp !== otp) {
//       return res.status(400).json({ message: "Wrong OTP" });
//     }

//     ride.status = "ongoing";
//     await ride.save();

//     res.json(ride);
//   } catch (err) {
//     res.status(500).json({ message: "OTP verify error" });
//   }
// };

// /* ================= DISTANCE ================= */
// const getDistance = (lat1, lon1, lat2, lon2) => {
//   const R = 6371;

//   const dLat = (lat2 - lat1) * Math.PI / 180;
//   const dLon = (lon2 - lon1) * Math.PI / 180;

//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos(lat1 * Math.PI / 180) *
//     Math.cos(lat2 * Math.PI / 180) *
//     Math.sin(dLon / 2) ** 2;

//   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
// };

// /* ================= REJECT ================= */
// export const rejectRide = async (req, res) => {
//   res.json({ message: "Rejected" });
// };
import Ride from "../models/Ride.js";
import Earning from "../models/Earning.js";
import Wallet from "../models/Wallet.js";
import { io, onlineDrivers, driverSockets, userSockets } from "../server.js";
import axios from "axios";
import { getSurgeMultiplier, applySurge } from "../Utils/surge.js";
import { calculateETA, findNearbyDrivers } from "../Utils/eta.js";

/* ─── SEND SMS OTP ─── */
const sendOTP = async (phone, otp) => {
  try {
    await axios.get("https://www.fast2sms.com/dev/bulkV2", {
      params: {
        authorization: process.env.FAST2SMS_API_KEY,
        route: "otp",
        variables_values: otp,
        flash: "0",
        numbers: phone,
      },
    });
    console.log("📲 OTP SENT TO:", phone);
  } catch (err) {
    console.log("❌ SMS ERROR:", err.response?.data || err.message);
  }
};

/* ─── ENSURE WALLET EXISTS ─── */
const ensureWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) wallet = await Wallet.create({ user: userId, balance: 0 });
  return wallet;
};

/* ═══════════════════════════════════════════
   CREATE RIDE  (with Surge + Smart Matching)
═══════════════════════════════════════════ */
export const createRide = async (req, res) => {
  try {
    const { pickup, drop, distance, fare: baseFare, pickupCoords } = req.body;

    console.log("BODY:", req.body);
    console.log("USER:", req.user);

    // ✅ AUTH CHECK
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ✅ INPUT CHECK
    if (!pickup || !drop || !distance || !baseFare) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (!pickupCoords || !pickupCoords.lat || !pickupCoords.lng) {
      return res.status(400).json({ message: "Invalid pickup coords" });
    }

    // ✅ SAFE DRIVER COUNT
    const driverCount = onlineDrivers
      ? Object.keys(onlineDrivers).length
      : 0;

    // ✅ SAFE SURGE
    let surgeMultiplier = 1;
    let surgeLabel = "Normal";

    try {
      const activeRideCount = await Ride.countDocuments({
        status: { $in: ["searching", "accepted", "ongoing"] },
      });

      const surgeData = getSurgeMultiplier(activeRideCount, driverCount);

      surgeMultiplier = surgeData?.multiplier || 1;
      surgeLabel = surgeData?.label || "Normal";

    } catch (err) {
      console.log("⚠️ Surge failed, fallback used");
    }

    const finalFare = baseFare * surgeMultiplier;

    // ✅ CREATE RIDE
    const ride = await Ride.create({
      rider: req.user.id,
      pickup,
      drop,
      distance,
      fare: finalFare,
      baseFare,
      surgeMultiplier,
      surgeLabel,
      status: "searching",
      pickupLat: pickupCoords.lat,
      pickupLng: pickupCoords.lng,
    });

    // ✅ SOCKET SAFE
    try {
      const driversArray = onlineDrivers
        ? Object.entries(onlineDrivers).map(([socketId, d]) => ({
            ...d,
            socketId,
          }))
        : [];

      const nearbyDrivers = findNearbyDrivers(
        driversArray,
        pickupCoords.lat,
        pickupCoords.lng,
        15
      );

      if (nearbyDrivers.length === 0) {
        Object.keys(onlineDrivers || {}).forEach((socketId) => {
          io.to(socketId).emit("new-ride", ride);
        });
      } else {
        nearbyDrivers.slice(0, 5).forEach((driver) => {
          io.to(driver.socketId).emit("new-ride", ride);
        });
      }
    } catch (err) {
      console.log("⚠️ Socket error:", err.message);
    }

    res.json(ride);

  } catch (err) {
    console.log("❌ FULL ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};;

/* ═══════════════════════════════════════════
   ACCEPT RIDE
═══════════════════════════════════════════ */
export const acceptRide = async (req, res) => {
  try {
    const ride = await Ride.findOneAndUpdate(
      { _id: req.params.id, status: "searching" },
      { driver: req.user.id, status: "accepted" },
      { new: true }
    )
      .populate("driver", "name vehicleNumber phone")
      .populate("rider", "name phone");

    if (!ride) return res.status(400).json({ message: "Ride already taken" });

    // ETA from driver to pickup
    const driverInfo = Object.values(onlineDrivers).find(
      (d) => d.userId === req.user.id
    );

    let etaData = null;
    if (driverInfo && ride.pickupLat) {
      etaData = calculateETA(driverInfo.lat, driverInfo.lng, ride.pickupLat, ride.pickupLng);
    }

    // Notify rider
    const riderSocket = userSockets?.[ride.rider._id.toString()];
    if (riderSocket) {
      io.to(riderSocket).emit("ride-accepted", { ride, eta: etaData });
    }

    // Notify other drivers to remove this request
    io.emit("ride-taken", ride._id);

    res.json({ ride, eta: etaData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════
   REJECT RIDE
═══════════════════════════════════════════ */
export const rejectRide = async (req, res) => {
  res.json({ message: "Rejected" });
};

/* ═══════════════════════════════════════════
   ARRIVED
═══════════════════════════════════════════ */
export const markArrived = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).populate("rider", "phone");
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    ride.status = "arrived";
    ride.otp = otp;
    await ride.save();

    if (ride.rider?.phone) await sendOTP(ride.rider.phone, otp);

    const riderSocket = userSockets?.[ride.rider._id.toString()];
    if (riderSocket) io.to(riderSocket).emit("otp-generated", { otp });

    res.json(ride);
  } catch (err) {
    console.log("❌ ARRIVED ERROR:", err);
    res.status(500).json({ message: "Arrived error" });
  }
};

/* ═══════════════════════════════════════════
   VERIFY OTP → START RIDE
═══════════════════════════════════════════ */
export const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    if (ride.otp !== otp) return res.status(400).json({ message: "Wrong OTP" });

    ride.status = "ongoing";
    ride.startedAt = new Date();
    await ride.save();

    res.json(ride);
  } catch (err) {
    res.status(500).json({ message: "OTP verify error" });
  }
};

/* ═══════════════════════════════════════════
   COMPLETE RIDE  (Earnings + Wallet)
═══════════════════════════════════════════ */
export const completeRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate("rider", "name _id")
      .populate("driver", "name _id");

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (!ride.driver) {
      return res.status(400).json({ message: "Driver not assigned" });
    }

    // ✅ update status
    ride.status = "completed";
    ride.completedAt = new Date();
    await ride.save();

    // ✅ earnings safe
    try {
      await Earning.create({
        driver: ride.driver._id,
        ride: ride._id,
        amount: ride.fare,
        baseAmount: ride.baseFare || ride.fare,
        surgeMultiplier: ride.surgeMultiplier || 1,
        distance: ride.distance,
      });
    } catch (err) {
      console.log("⚠️ Earning error:", err.message);
    }

    // ✅ wallet safe
    try {
      let wallet = await Wallet.findOne({ user: ride.driver._id });

      if (!wallet) {
        wallet = await Wallet.create({
          user: ride.driver._id,
          balance: 0,
          transactions: [], // 🔥 IMPORTANT
        });
      }

      wallet.balance += ride.fare;

      if (!wallet.transactions) wallet.transactions = [];

      wallet.transactions.push({
        type: "credit",
        amount: ride.fare,
        description: `Ride: ${ride.pickup} → ${ride.drop}`,
        ride: ride._id,
      });

      await wallet.save();
    } catch (err) {
      console.log("⚠️ Wallet error:", err.message);
    }

    // ✅ socket safe
    try {
      const riderSocket = userSockets?.[ride.rider._id.toString()];
      if (riderSocket) {
        io.to(riderSocket).emit("ride-completed", ride);
      }
    } catch (err) {
      console.log("⚠️ Socket error:", err.message);
    }

    res.json(ride);

  } catch (err) {
    console.log("❌ COMPLETE FULL ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════
   CANCEL RIDE
═══════════════════════════════════════════ */
export const cancelRide = async (req, res) => {
  try {
    const ride = await Ride.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true }
    );
    io.emit("ride-cancelled", ride._id);
    res.json(ride);
  } catch (err) {
    res.status(500).json({ message: "Cancel error" });
  }
};

/* ═══════════════════════════════════════════
   GET MY LATEST RIDE (Rider)
═══════════════════════════════════════════ */
export const getMyLatestRide = async (req, res) => {
  try {
    const ride = await Ride.findOne({ rider: req.user.id })
      .sort({ createdAt: -1 })
      .populate("driver", "name vehicleNumber phone");
    res.json(ride);
  } catch (err) {
    res.status(500).json({ message: "Error fetching latest ride" });
  }
};

/* ═══════════════════════════════════════════
   GET MY RIDES (Rider history)
═══════════════════════════════════════════ */
export const getMyRides = async (req, res) => {
  try {
    const rides = await Ride.find({ rider: req.user.id })
      .sort({ createdAt: -1 })
      .populate("driver", "name");
    res.json(rides);
  } catch (err) {
    res.status(500).json({ message: "Error fetching rides" });
  }
};

/* ═══════════════════════════════════════════
   GET LATEST SEARCHING RIDE (Driver)
═══════════════════════════════════════════ */
export const getLatestRide = async (req, res) => {
  try {
    const ride = await Ride.findOne({ status: "searching" })
      .populate("rider", "name phone");
    res.json(ride);
  } catch (err) {
    res.status(500).json({ message: "Error fetching ride" });
  }
};

/* ═══════════════════════════════════════════
   GET SURGE INFO
═══════════════════════════════════════════ */
export const getSurgeInfo = async (req, res) => {
  try {
    const activeRideCount = await Ride.countDocuments({
      status: { $in: ["searching", "accepted", "ongoing"] },
    });
    const driverCount = Object.keys(onlineDrivers).length;
    const surgeData = getSurgeMultiplier(activeRideCount, driverCount);
    res.json(surgeData);
  } catch (err) {
    res.status(500).json({ message: "Surge error" });
  }
};

/* ═══════════════════════════════════════════
   GET ETA (Rider can request ETA of driver)
═══════════════════════════════════════════ */
export const getDriverETA = async (req, res) => {
  try {
    const { rideId } = req.params;
    const ride = await Ride.findById(rideId).populate("driver");
    if (!ride || !ride.driver) return res.json({ eta: null });

    const driverInfo = Object.values(onlineDrivers).find(
      (d) => d.userId === ride.driver._id.toString()
    );
    if (!driverInfo) return res.json({ eta: null });

    const eta = calculateETA(driverInfo.lat, driverInfo.lng, ride.pickupLat, ride.pickupLng);
    res.json({ eta });
  } catch (err) {
    res.status(500).json({ message: "ETA error" });
  }
};