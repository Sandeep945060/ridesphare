import express from "express";
const router = express.Router();

import Driver from "../models/Driver.js";
import User from "../models/User.js";

// ================= VERIFY =================
router.post("/verify", async (req, res) => {
  try {
    const { userId, licenseNumber, vehicleNumber, vehicleType } = req.body;

    let driver = await Driver.findOne({ userId });

    if (!driver) {
      driver = new Driver({ userId });
    }

    driver.licenseNumber = licenseNumber;
    driver.vehicleNumber = vehicleNumber;
    driver.vehicleType = vehicleType;
    driver.status = "pending";

    await driver.save();

    res.json({ message: "Submitted" });
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});

// ================= GET ALL =================
router.get("/all", async (req, res) => {
  const drivers = await Driver.find().populate("userId");
  res.json(drivers);
});

// ================= STATUS =================
router.get("/status/:userId", async (req, res) => {
  const driver = await Driver.findOne({ userId: req.params.userId });

 
  if (!driver) {
    return res.json({ status: null }); // 🔥 CHANGE HERE
  }

  res.json({ status: driver.status });
});

// ================= APPROVE =================
router.put("/approve/:id", async (req, res) => {
  const driver = await Driver.findById(req.params.id);

  driver.status = "approved";
  await driver.save();

  await User.findByIdAndUpdate(driver.userId, {
    verificationStatus: "approved",
  });

  res.json({ message: "Approved" });
});

// ================= REJECT =================
router.put("/reject/:id", async (req, res) => {
  const driver = await Driver.findById(req.params.id);

  driver.status = "rejected";
  await driver.save();

  await User.findByIdAndUpdate(driver.userId, {
    verificationStatus: "rejected",
  });

  res.json({ message: "Rejected" });
});

export default router;