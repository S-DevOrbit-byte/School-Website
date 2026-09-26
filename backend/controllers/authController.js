const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const signToken = (admin) =>
  jwt.sign({ id: admin._id, username: admin.username }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // requires HTTPS in production
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required." });
    }

    const admin = await Admin.findOne({ username: username.trim().toLowerCase() });
    if (!admin) {
      return res.status(401).json({ success: false, message: "Invalid username or password." });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid username or password." });
    }

    const token = signToken(admin);
    res.cookie("token", token, cookieOptions());

    res.json({
      success: true,
      message: "Login successful.",
      token, // also returned so the frontend can use Authorization header if cookies are blocked
      admin: { id: admin._id, username: admin.username },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error during login.", error: err.message });
  }
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  res.clearCookie("token", cookieOptions());
  res.json({ success: true, message: "Logged out." });
};

// GET /api/auth/me
exports.getMe = (req, res) => {
  res.json({ success: true, admin: req.admin });
};
