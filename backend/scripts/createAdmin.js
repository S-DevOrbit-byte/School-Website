// Run with: npm run seed:admin
// Creates (or updates the password of) the admin account defined in .env
require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/Admin");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const username = (process.env.ADMIN_USERNAME || "admin").toLowerCase();
    const password = process.env.ADMIN_PASSWORD || "admin123";

    let admin = await Admin.findOne({ username });

    if (admin) {
      admin.password = password; // pre-save hook re-hashes it
      await admin.save();
      console.log(`Existing admin "${username}" password updated.`);
    } else {
      admin = await Admin.create({ username, password });
      console.log(`Admin "${username}" created.`);
    }

    process.exit(0);
  } catch (err) {
    console.error("Failed to seed admin:", err.message);
    process.exit(1);
  }
})();
