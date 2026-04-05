import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  let token;

  // ✅ 1. CHECK HEADER (Bearer token)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // ✅ 2. CHECK COOKIE (fallback)
  else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  // ❌ NO TOKEN
  if (!token) {
    return res.status(401).json({
      message: "Not authorized, token missing",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

/* ROLE BASED */
export const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }
    next();
  };
};
