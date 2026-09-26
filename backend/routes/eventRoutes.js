const express = require("express");
const router = express.Router();
const { getEvents, createEvent, updateEvent, deleteEvent } = require("../controllers/eventController");
const { protect } = require("../middleware/auth");

router.get("/", getEvents); // public
router.post("/", protect, createEvent); // admin only
router.put("/:id", protect, updateEvent); // admin only
router.delete("/:id", protect, deleteEvent); // admin only

module.exports = router;
