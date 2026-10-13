const express = require("express");
const router = express.Router();
const retailController = require("../controllers/retailController");
const authMiddleware = require("../middleware/authMiddleware");
const db = require("../config/db");
const { verifyToken, verifyRetail } = require("../middleware/auth");

router.use(authMiddleware.verifyToken);
router.use(authMiddleware.checkRole('retail', 'admin'));

router.get("/dashboard-stats", retailController.getDashboardStats);
router.get("/pending-verifications", retailController.getPendingVerifications);
router.put("/verify/:id", retailController.verifyListing);
router.get("/approved-listings", retailController.getApprovedListings);
router.get("/rejected-listings", retailController.getRejectedListings);
router.get("/deliveries", retailController.getDeliveries);
router.put("/delivery/:id/status", retailController.updateDeliveryStatus);
router.get("/reports", retailController.getReports);
// Delivery management routes
router.get("/delivery/:id", retailController.getDeliveryDetails);
router.put("/delivery/:id/update", retailController.updateDeliveryDetails);
router.put("/delivery/:id/status", retailController.updateDeliveryStatus);
router.post("/delivery/create", retailController.createDelivery);
module.exports = router;

// ---------------------------------------------------------------
// GET /pending-verifications  (existing — should return all products
// where retail_partner_id = req.user.id AND verification_status='pending')
// ---------------------------------------------------------------
router.get("/pending-verifications", verifyToken, verifyRetail, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, u.full_name AS seller_name
       FROM products p
       JOIN users u ON p.seller_id = u.id
       WHERE p.retail_partner_id = ?
         AND p.verification_status = 'pending'
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json({ listings: rows });
  } catch (err) {
    console.error("pending-verifications error:", err);
    res.status(500).json({ message: "Failed to load pending verifications" });
  }
});

// ---------------------------------------------------------------
// PUT /verify/:id  — retail partner approves / rejects
// ---------------------------------------------------------------
router.put("/verify/:id", verifyToken, verifyRetail, async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!["verified", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    // Ensure this retail partner owns the verification
    const [check] = await db.query(
      `SELECT id FROM products
       WHERE id = ? AND retail_partner_id = ?`,
      [id, req.user.id]
    );
    if (check.length === 0) {
      return res.status(403).json({ message: "Not authorized for this listing" });
    }

    await db.query(
      `UPDATE products
       SET verification_status = ?, is_published = FALSE
       WHERE id = ?`,
      [status, id]
    );

    await db.query(
      `UPDATE retail_verifications
       SET status = ?, notes = ?, verified_at = NOW()
       WHERE product_id = ?`,
      [status, notes || null, id]
    );

    // Notify admin (optional)
    await db.query(
      `INSERT INTO notifications (user_id, message, type, is_read, created_at)
       SELECT id, CONCAT('Listing #', ?, ' was ', ?, ' by retail partner'), 'admin', FALSE, NOW()
       FROM users WHERE role = 'admin'`,
      [id, status]
    );

    res.json({ message: `Listing ${status} successfully` });
  } catch (err) {
    console.error("verify error:", err);
    res.status(500).json({ message: "Verification failed" });
  }
});

module.exports = router;