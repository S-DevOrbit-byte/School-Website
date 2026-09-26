const express = require("express");
const router = express.Router();
const { getNotices, createNotice, deleteNotice } = require("../controllers/noticeController");
const { protect } = require("../middleware/auth");

router.get("/", getNotices); // public
router.post("/", protect, createNotice); // admin only
router.delete("/:id", protect, deleteNotice); // admin only

module.exports = router;
