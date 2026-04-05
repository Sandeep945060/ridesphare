import Message from "../models/Message.js";
import { io, userSockets, driverSockets } from "../server.js";
import Ride from "../models/Ride.js";

/* ═══════════════════════════════════════════
   SEND MESSAGE
═══════════════════════════════════════════ */
export const sendMessage = async (req, res) => {
  try {
    const { rideId, text, senderRole } = req.body;

    const ride = await Ride.findById(rideId).populate("rider driver");
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    const msg = await Message.create({
      ride: rideId,
      sender: req.user.id,
      senderRole,
      text: text.trim(),
    });

    // ── Real-time delivery via socket room
    io.to(rideId).emit("new-message", {
      _id: msg._id,
      text: msg.text,
      senderRole: msg.senderRole,
      createdAt: msg.createdAt,
    });

    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════
   GET MESSAGES FOR A RIDE
═══════════════════════════════════════════ */
export const getMessages = async (req, res) => {
  try {
    const { rideId } = req.params;

    const messages = await Message.find({ ride: rideId })
      .sort({ createdAt: 1 })
      .select("text senderRole createdAt read");

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ═══════════════════════════════════════════
   MARK MESSAGES AS READ
═══════════════════════════════════════════ */
export const markRead = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { role } = req.body; // "rider" or "driver" - mark opposite role's msgs read

    const oppositeRole = role === "rider" ? "driver" : "rider";

    await Message.updateMany(
      { ride: rideId, senderRole: oppositeRole, read: false },
      { read: true }
    );

    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};