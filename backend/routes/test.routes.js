import express from "express";
import { protect, allowRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
  "/admin-check",
  protect,
  allowRoles("admin"),
  (req, res) => {
    res.json({
      message: "Admin verified",
      user: req.user,
    });
  }
);

export default router;
