// import express from "express";
// import jwt from "jsonwebtoken";
// import User from "../models/User.js";

// const router = express.Router();

// /* ================= SIGNUP ================= */
// router.post("/signup", async (req, res) => {
//   try {
//     console.log("SIGNUP BODY 👉", req.body);

//     const { name, email, phone, password, role } = req.body;

//     // ✅ validation
//     if (!name || !email || !phone || !password || !role) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     if (!["rider", "driver", "admin"].includes(role)) {
//       return res.status(400).json({ message: "Invalid role" });
//     }

//     // ✅ GLOBAL email check
//     const exists = await User.findOne({ email });
//     if (exists) {
//       return res.status(400).json({
//         message: "Email already registered",
//       });
//     }

//     // ✅ password auto-hash by model
//     const user = await User.create({
//       name,
//       email,
//       phone,
//       password,
//       role,
//     });

//     res.status(201).json({
//       message: "Signup successful",
//       user: {
//         id: user._id,
//         name: user.name,
//         role: user.role,
//       },
//     });
//   } catch (error) {
//   console.error("SIGNUP ERROR 👉", error);
//   res.status(500).json({
//     message: error.message,
//     code: error.code,
//   });
// }
// })

// /* ================= LOGIN ================= */
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password, role } = req.body;

//     if (!email || !password || !role) {
//       return res.status(400).json({ message: "All fields required" });
//     }

//     const user = await User.findOne({ email, role });
//     if (!user) {
//       return res.status(404).json({
//         message: "User not found for this role",
//       });
//     }

//     const isMatch = await user.matchPassword(password);
//     if (!isMatch) {
//       return res.status(401).json({
//         message: "Invalid credentials",
//       });
//     }

//     const token = jwt.sign(
//       { id: user._id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     // 🍪 cookie auth
//     res.cookie("token", token, {
//       httpOnly: true,
//       // sameSite: "strict",
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//     });

//     res.json({
//       message: "Login successful",
//       user: {
//         id: user._id,
//         name: user.name,
//         role: user.role,
//       },
//     });
//   } catch (error) {
//     console.error("LOGIN ERROR 👉", error);
//     res.status(500).json({ message: "Login failed" });
//   }
// });

// /* ================= LOGOUT ================= */
// router.post("/logout", (req, res) => {
//   res.clearCookie("token");
//   res.json({ message: "Logged out successfully" });
// });

// export default router;
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

/* ================= SIGNUP ================= */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // validation
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!["rider", "driver", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // email check
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // create user (password auto-hash in model)
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role,
    });

    res.status(201).json({
      message: "Signup successful",
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("SIGNUP ERROR 👉", error);
    res.status(500).json({ message: "Signup failed" });
  }
});

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "All fields required" });
    }

    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(404).json({ message: "User not found for this role" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ COOKIE (localhost safe)
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",   // 🔥 IMPORTANT
      secure: false,     // localhost
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

   res.status(200).json({
  message: "Login successful",
  token, // 🔥 ADD THIS LINE
  user: {
    id: user._id,
    name: user.name,
    role: user.role,
  },
});
  } catch (error) {
    console.error("LOGIN ERROR 👉", error);
    res.status(500).json({ message: "Login failed" });
  }
});

/* ================= LOGOUT ================= */
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });
  res.json({ message: "Logged out successfully" });
});

export default router;
