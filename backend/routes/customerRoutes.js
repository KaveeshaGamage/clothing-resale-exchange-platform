const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");
const db = require("../config/db");           // adjust path to your db
const multer = require("multer");

const listingImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const listingImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 5, fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!listingImageTypes.has(file.mimetype)) {
      callback(new Error("Listing photos must be JPEG, PNG, or WebP images."));
      return;
    }
    callback(null, true);
  }
});

const parseListingImages = (req, res, next) => {
  listingImageUpload.array("images", 5)(req, res, (error) => {
    if (!error) {
      next();
      return;
    }
    if (error instanceof multer.MulterError) {
      return res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400)
        .json({ message: error.message });
    }
    return res.status(400).json({ message: error.message });
  });
};

const hasValidListingImageSignature = ({ buffer, mimetype }) => {
  if (mimetype === "image/jpeg") {
    return buffer.length >= 3 &&
      buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimetype === "image/png") {
    return buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mimetype === "image/webp") {
    return buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP";
  }
  return false;
};

const allowedComplaintImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

const complaintImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 5,
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, callback) => {
    if (!allowedComplaintImageTypes.has(file.mimetype)) {
      callback(new Error("Evidence images must be JPEG, PNG, or WebP."));
      return;
    }
    callback(null, true);
  }
});

const parseComplaintImages = (req, res, next) => {
  complaintImageUpload.array("images", 5)(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(status).json({ message: error.message });
    }

    return res.status(400).json({ message: error.message });
  });
};

const hasValidImageSignature = (file) => {
  const { buffer, mimetype } = file;
  if (mimetype === "image/jpeg") {
    return buffer.length >= 3 &&
      buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimetype === "image/png") {
    return buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mimetype === "image/webp") {
    return buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP";
  }
  return false;
};

// Protect all routes
router.use(authMiddleware.verifyToken);

// My Listings (products I'm selling)
router.get("/my-listings", productController.getSellerListings);

// My Orders (products I bought)
router.get("/my-orders", orderController.getMyOrders);

// Customer dashboard summary and recent activity
router.get("/dashboard", authMiddleware.checkRole("customer"), async (req, res) => {
  const customerId = req.user.id;

  try {
    const [[statsRows], [recentOrders], [newArrivals]] = await Promise.all([
      db.promise().query(
        `SELECT
          (SELECT COUNT(*) FROM orders WHERE buyer_id = ?) AS orderCount,
          (SELECT COUNT(*) FROM products WHERE seller_id = ?) AS listingCount,
          (SELECT COUNT(*) FROM cart WHERE user_id = ?) AS cartCount,
          (SELECT COUNT(*) FROM favorites WHERE user_id = ?) AS savedCount,
          (SELECT COALESCE(SUM(total_amount), 0) FROM orders
            WHERE buyer_id = ? AND order_status <> 'cancelled') AS totalSpend`,
        [customerId, customerId, customerId, customerId, customerId]
      ),
      db.promise().query(
        `SELECT o.id, o.total_amount,
          CASE
            WHEN o.order_status = 'cancelled' THEN 'cancelled'
            WHEN ds.delivery_count > 0 AND ds.delivered_count = ds.delivery_count
              THEN 'delivered'
            WHEN ds.active_count > 0 OR ds.delivered_count > 0 THEN 'shipped'
            WHEN ds.failed_count > 0 THEN 'confirmed'
            ELSE o.order_status
          END AS order_status,
          (
            SELECT d.delivery_status
            FROM deliveries d
            WHERE d.order_id = o.id
            ORDER BY d.updated_at DESC, d.id DESC
            LIMIT 1
          ) AS delivery_status,
          o.order_date,
          (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS items_count
         FROM orders o
         LEFT JOIN (
           SELECT order_id,
                  COUNT(*) AS delivery_count,
                  SUM(delivery_status = 'delivered') AS delivered_count,
                  SUM(delivery_status IN
                    ('picked_up', 'in_transit', 'out_for_delivery')) AS active_count,
                  SUM(delivery_status = 'failed') AS failed_count
           FROM deliveries
           GROUP BY order_id
         ) ds ON ds.order_id = o.id
         WHERE o.buyer_id = ?
         ORDER BY o.order_date DESC
         LIMIT 5`,
        [customerId]
      ),
      db.promise().query(
        `SELECT id, name, brand, category, size, price, original_price, image_url
         FROM products
         WHERE status = 'available'
           AND verification_status = 'verified'
           AND is_published = TRUE
           AND quantity > 0
         ORDER BY created_at DESC
         LIMIT 4`
      ),
    ]);

    res.json({
      success: true,
      stats: statsRows[0],
      recentOrders,
      newArrivals,
    });
  } catch (err) {
    console.error("Customer dashboard error:", err);
    res.status(500).json({ message: "Failed to load customer dashboard" });
  }
});




// ---------------------------------------------------------------
// POST create listing (existing route — just ensure it saves retail_partner_id)
// ---------------------------------------------------------------
router.post("/my-listings", parseListingImages, async (req, res) => {
  try {
    const {
      name, brand, category, size, color, condition_status,
      quantity, price, original_price, description,
      receipt_number, order_number, image_url,
      retail_partner_id
    } = req.body;
    const listingImages = req.files || [];

    if (!retail_partner_id) {
      return res.status(400).json({ message: "Retail partner is required" });
    }
    const stockQuantity = Number(quantity);
    if (!Number.isInteger(stockQuantity) || stockQuantity < 1 || stockQuantity > 10000) {
      return res.status(400).json({
        message: "Quantity must be a whole number between 1 and 10,000"
      });
    }
    if (listingImages.some((image) => !hasValidListingImageSignature(image))) {
      return res.status(400).json({
        message: "One or more files are not valid JPEG, PNG, or WebP images"
      });
    }

    const imageUrl = listingImages.length
      ? JSON.stringify(listingImages.map((image) =>
          `data:${image.mimetype};base64,${image.buffer.toString("base64")}`
        ))
      : (image_url || null);

    const [result] = await db.promise().query(
      `INSERT INTO products
        (seller_id, name, brand, category, size, color, condition_status,
         quantity, price, original_price, description,
         receipt_number, order_number, image_url,
         retail_partner_id, verification_status, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', FALSE)`,
      [
        req.user.id, name, brand, category, size, color, condition_status,
        stockQuantity, price, original_price, description,
        receipt_number, order_number, imageUrl, retail_partner_id
      ]
    );

    res.json({
      id: result.insertId,
      message: "Listing submitted. Awaiting admin review and retail verification."
    });
  } catch (err) {
    console.error("create listing error:", err);
    res.status(500).json({ message: "Failed to create listing" });
  }
});
// ---------------------------------------------------------------
// GET registered retail partners (for SellItem dropdown)
// ---------------------------------------------------------------
router.get("/retail-partners", async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT id, fullName, email, phone
       FROM users
       WHERE role = 'retail'
       ORDER BY fullName ASC`
    );
    res.json({ partners: rows });
  } catch (err) {
    console.error("retail-partners error:", err);
    res.status(500).json({ message: "Failed to load retail partners" });
  }
});

router.get("/complaints/mine", authMiddleware.checkRole("customer"), async (req, res) => {
  try {
    const [complaints] = await db.promise().query(
      `SELECT c.*,
          (SELECT COUNT(*) FROM complaint_attachments ca
           WHERE ca.complaint_id = c.id) AS attachment_count
       FROM complaints c
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json({ complaints });
  } catch (err) {
    console.error("Customer complaints fetch error:", err);
    res.status(500).json({ message: "Failed to load your complaints" });
  }
});

router.post(
  "/complaints",
  authMiddleware.checkRole("customer"),
  parseComplaintImages,
  async (req, res) => {
    const subject = typeof req.body.subject === "string" ? req.body.subject.trim() : "";
    const description = typeof req.body.description === "string"
      ? req.body.description.trim()
      : "";
    const images = req.files || [];

    if (!subject || !description) {
      return res.status(400).json({ message: "Subject and description are required" });
    }
    if (subject.length > 200) {
      return res.status(400).json({ message: "Subject must be 200 characters or fewer" });
    }
    if (description.length > 10000) {
      return res.status(400).json({ message: "Description must be 10,000 characters or fewer" });
    }
    if (images.some((image) => !hasValidImageSignature(image))) {
      return res.status(400).json({
        message: "One or more files are not valid JPEG, PNG, or WebP images"
      });
    }

    let connection;
    try {
      connection = await db.promise().getConnection();
      await connection.beginTransaction();
      const [result] = await connection.query(
        `INSERT INTO complaints (user_id, subject, description, status, priority)
         VALUES (?, ?, ?, 'pending', 'medium')`,
        [req.user.id, subject, description]
      );

      for (const image of images) {
        await connection.query(
          `INSERT INTO complaint_attachments
             (complaint_id, original_name, mime_type, file_size, image_data)
           VALUES (?, ?, ?, ?, ?)`,
          [
            result.insertId,
            image.originalname.slice(0, 255),
            image.mimetype,
            image.size,
            image.buffer
          ]
        );
      }

      await connection.commit();
      res.status(201).json({
        message: "Complaint submitted successfully",
        complaintId: result.insertId
      });
    } catch (err) {
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error("Customer complaint rollback error:", rollbackError);
        }
      }
      console.error("Customer complaint submit error:", err);
      res.status(500).json({ message: "Failed to submit complaint" });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
);

module.exports = router;