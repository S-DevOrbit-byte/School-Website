const Notice = require("../models/Notice");

// GET /api/notices  (public - anyone visiting the site can view)
exports.getNotices = async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.json({ success: true, count: notices.length, notices });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch notices.", error: err.message });
  }
};

// POST /api/notices  (protected - admin only)
exports.createNotice = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: "Title and description are required." });
    }

    const notice = await Notice.create({
      title: title.trim(),
      description: description.trim(),
      postedBy: req.admin.id,
    });

    res.status(201).json({ success: true, message: "Notice added.", notice });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to create notice.", error: err.message });
  }
};

// DELETE /api/notices/:id  (protected - admin only)
exports.deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);

    if (!notice) {
      return res.status(404).json({ success: false, message: "Notice not found." });
    }

    res.json({ success: true, message: "Notice deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete notice.", error: err.message });
  }
};
