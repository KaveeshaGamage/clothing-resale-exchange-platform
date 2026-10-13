const express = require("express");
const router = express.Router();

const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware.verifyToken);

// =====================================================
// GET /api/notifications
// =====================================================
router.get("/", async (req, res) => {
  try {

    const [notifications] = await db.promise().query(
      `SELECT
          id,
          message,
          type,
          is_read,
          created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      notifications
    });

  } catch (err) {

    console.error("get notifications error:", err);

    res.status(500).json({
      message: "Failed to fetch notifications"
    });
  }
});

// =====================================================
// PUT /api/notifications/:id/read
// =====================================================
router.put("/:id/read", async (req, res) => {
  try {

    await db.promise().query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = ?
       AND user_id = ?`,
      [
        req.params.id,
        req.user.id
      ]
    );

    res.json({
      message: "Notification marked as read"
    });

  } catch (err) {

    console.error("read notification error:", err);

    res.status(500).json({
      message: "Failed to update notification"
    });
  }
});

// =====================================================
// PUT /api/notifications/read-all
// =====================================================
router.put("/read-all", async (req, res) => {
  try {

    await db.promise().query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = ?`,
      [req.user.id]
    );

    res.json({
      message: "All notifications marked as read"
    });

  } catch (err) {

    console.error("read all notifications error:", err);

    res.status(500).json({
      message: "Failed to update notifications"
    });
  }
});

// =====================================================
// DELETE /api/notifications/:id
// =====================================================
router.delete("/:id", async (req, res) => {
  try {

    await db.promise().query(
      `DELETE FROM notifications
       WHERE id = ?
       AND user_id = ?`,
      [
        req.params.id,
        req.user.id
      ]
    );

    res.json({
      message: "Notification deleted"
    });

  } catch (err) {

    console.error("delete notification error:", err);

    res.status(500).json({
      message: "Failed to delete notification"
    });
  }
});

module.exports = router;