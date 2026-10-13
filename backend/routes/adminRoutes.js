const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const db = require("../config/db");

const { verifyToken, verifyAdmin } = require("../middleware/auth");
// All routes require admin authentication
router.use(authMiddleware.verifyToken);
router.use(authMiddleware.checkRole('admin'));

// Dashboard
router.get("/dashboard-stats", adminController.getDashboardStats);

// Users
router.get("/users", adminController.getUsers);
router.post("/users", adminController.createUser);
router.delete("/users/:id", adminController.deleteUser);
router.put("/users/:id/role", adminController.updateUserRole);

// Listings
router.get("/listings", adminController.getListings);
router.delete("/listings/:id", adminController.deleteListing);

// Transactions
router.get("/transactions", adminController.getTransactions);

// Complaints
router.get("/complaints", adminController.getComplaints);
router.get("/complaints/:id/attachments", async (req, res) => {
  try {
    const [attachments] = await db.promise().query(
      `SELECT ca.id, ca.original_name, ca.mime_type, ca.image_data
       FROM complaint_attachments ca
       WHERE ca.complaint_id = ?
       ORDER BY ca.id ASC`,
      [req.params.id]
    );
    res.json({
      attachments: attachments.map((attachment) => ({
        id: attachment.id,
        original_name: attachment.original_name,
        mime_type: attachment.mime_type,
        data: attachment.image_data.toString("base64")
      }))
    });
  } catch (err) {
    console.error("Admin complaint attachments fetch error:", err);
    res.status(500).json({ message: "Failed to load complaint attachments" });
  }
});
router.put("/complaints/:id", adminController.updateComplaint);

// Settings
router.get("/settings", adminController.getSettings);
router.put("/settings", adminController.updateSettings);

// Reports
router.get("/reports", adminController.getReports);
// Assign listing to retail partner
router.put("/listings/:id/assign", adminController.assignListingToRetail);
router.put("/listings/:id/send-for-approval", adminController.assignListingToRetail);
router.put("/users/:id", adminController.updateUser);



// ---------------------------------------------------------------
// GET all listings (existing — no change, but confirm it returns:
// id, name, brand, category, size, condition_status, price,
// image_url, seller_name, verification_status, is_published,
// retail_partner_id)
// ---------------------------------------------------------------

// ---------------------------------------------------------------
// PUT /listings/:id/send-for-approval
// Assigns listing to a retail partner and puts it in their queue
// ---------------------------------------------------------------
// ---------------------------------------------------------------
// PUT /listings/:id/publish — Publish a verified listing to shop
// ---------------------------------------------------------------
router.put("/listings/:id/publish", authMiddleware.verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.promise().query(
      "SELECT verification_status FROM products WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Listing not found" });
    }
    if (rows[0].verification_status !== "verified") {
      return res.status(400).json({
        message: "Only verified listings can be published"
      });
    }

    await db.promise().query(
      "UPDATE products SET is_published = TRUE WHERE id = ?",
      [id]
    );

    res.json({ message: "Listing published to shop" });
  } catch (err) {
    console.error("publish error:", err);
    res.status(500).json({ message: "Failed to publish listing" });
  }
});

// ---------------------------------------------------------------
// PUT /listings/:id/unpublish — Remove from shop
// ---------------------------------------------------------------
router.put("/listings/:id/unpublish", authMiddleware.verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await db.promise().query(
      "UPDATE products SET is_published = FALSE WHERE id = ?",
      [id]
    );
    res.json({ message: "Listing removed from shop" });
  } catch (err) {
    console.error("unpublish error:", err);
    res.status(500).json({ message: "Failed to unpublish listing" });
  }
});

// ---------------------------------------------------------------
// PUT /listings/:id/publish
// Publishes a verified listing so it appears in ShopPage
// ---------------------------------------------------------------
router.put("/listings/:id/publish", verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT verification_status FROM products WHERE id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Listing not found" });
    }
    if (rows[0].verification_status !== "verified") {
      return res.status(400).json({
        message: "Only verified listings can be published"
      });
    }

    await db.query(
      "UPDATE products SET is_published = TRUE WHERE id = ?",
      [id]
    );

    res.json({ message: "Listing published to shop" });
  } catch (err) {
    console.error("publish error:", err);
    res.status(500).json({ message: "Failed to publish listing" });
  }
});

module.exports = router;