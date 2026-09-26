const Event = require("../models/Event");

// GET /api/events  (public - soonest events first)
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json({ success: true, count: events.length, events });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch events.", error: err.message });
  }
};

// POST /api/events  (protected - admin only)
exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, location, images } = req.body;

    if (!title || !description || !date) {
      return res.status(400).json({ success: false, message: "Title, description, and date are required." });
    }

    const event = await Event.create({
      title: title.trim(),
      description: description.trim(),
      date,
      location: (location || "").trim(),
      images: Array.isArray(images) ? images.filter(Boolean) : [],
      createdBy: req.admin.id,
    });

    res.status(201).json({ success: true, message: "Event added.", event });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to create event.", error: err.message });
  }
};

// PUT /api/events/:id  (protected - admin only)
exports.updateEvent = async (req, res) => {
  try {
    const { title, description, date, location, images } = req.body;

    if (!title || !description || !date) {
      return res.status(400).json({ success: false, message: "Title, description, and date are required." });
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      {
        title: title.trim(),
        description: description.trim(),
        date,
        location: (location || "").trim(),
        images: Array.isArray(images) ? images.filter(Boolean) : [],
      },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found." });
    }

    res.json({ success: true, message: "Event updated.", event });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update event.", error: err.message });
  }
};

// DELETE /api/events/:id  (protected - admin only)
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found." });
    }

    res.json({ success: true, message: "Event deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete event.", error: err.message });
  }
};
