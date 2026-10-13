const express = require("express");
const router = express.Router();

const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware.verifyToken);

// =====================================================
// GET /api/messages
// Get all conversations for current user
// =====================================================
router.get("/", async (req, res) => {
  try {

    const userId = req.user.id;

    const [messages] = await db.promise().query(
      `SELECT
          m.id,
          m.sender_id,
          m.receiver_id,
          m.message,
          m.is_read,
          m.created_at,

          sender.fullName AS sender_name,
          receiver.fullName AS receiver_name

       FROM messages m

       INNER JOIN users sender
          ON m.sender_id = sender.id

       INNER JOIN users receiver
          ON m.receiver_id = receiver.id

       WHERE m.sender_id = ?
          OR m.receiver_id = ?

       ORDER BY m.created_at ASC`,
      [
        userId,
        userId
      ]
    );

    res.json({
      messages
    });

  } catch (err) {

    console.error("get messages error:", err);

    res.status(500).json({
      message: "Failed to fetch messages"
    });
  }
});

// =====================================================
// GET /api/messages/:userId
// Get conversation with another user
// =====================================================
router.get("/:userId", async (req, res) => {
  try {

    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    const [messages] = await db.promise().query(
      `SELECT
          m.id,
          m.sender_id,
          m.receiver_id,
          m.message,
          m.is_read,
          m.created_at,
          sender.fullName AS sender_name,
          receiver.fullName AS receiver_name

       FROM messages m

       INNER JOIN users sender
          ON m.sender_id = sender.id

       INNER JOIN users receiver
          ON m.receiver_id = receiver.id

       WHERE
          (m.sender_id = ? AND m.receiver_id = ?)
          OR
          (m.sender_id = ? AND m.receiver_id = ?)

       ORDER BY m.created_at ASC`,
      [
        currentUserId,
        otherUserId,
        otherUserId,
        currentUserId
      ]
    );

    // Mark received messages as read
    await db.promise().query(
      `UPDATE messages
       SET is_read = TRUE
       WHERE sender_id = ?
       AND receiver_id = ?`,
      [
        otherUserId,
        currentUserId
      ]
    );

    res.json({
      messages
    });

  } catch (err) {

    console.error(
      "get conversation error:",
      err
    );

    res.status(500).json({
      message: "Failed to fetch conversation"
    });
  }
});

// =====================================================
// POST /api/messages
// Send message
// =====================================================
router.post("/", async (req, res) => {
  try {

    const senderId = req.user.id;

    const {
      receiver_id,
      message
    } = req.body;

    if (!receiver_id || !message?.trim()) {
      return res.status(400).json({
        message:
          "receiver_id and message are required"
      });
    }

    const [receiver] = await db.promise().query(
      `SELECT id
       FROM users
       WHERE id = ?`,
      [receiver_id]
    );

    if (receiver.length === 0) {
      return res.status(404).json({
        message: "Receiver not found"
      });
    }

    if (Number(receiver_id) === Number(senderId)) {
      return res.status(400).json({
        message: "You cannot message yourself"
      });
    }

    await db.promise().query(
      `INSERT INTO messages
        (
          sender_id,
          receiver_id,
          message
        )
       VALUES (?, ?, ?)`,
      [
        senderId,
        receiver_id,
        message.trim()
      ]
    );

    res.status(201).json({
      message: "Message sent successfully"
    });

  } catch (err) {

    console.error(
      "send message error:",
      err
    );

    res.status(500).json({
      message: "Failed to send message"
    });
  }
});

// =====================================================
// PUT /api/messages/:id/read
// =====================================================
router.put("/:id/read", async (req, res) => {
  try {

    await db.promise().query(
      `UPDATE messages
       SET is_read = TRUE
       WHERE id = ?
       AND receiver_id = ?`,
      [
        req.params.id,
        req.user.id
      ]
    );

    res.json({
      message: "Message marked as read"
    });

  } catch (err) {

    console.error(
      "read message error:",
      err
    );

    res.status(500).json({
      message: "Failed to update message"
    });
  }
});

module.exports = router;