const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const authMiddleware = require("../middleware/authMiddleware");
const { verifyToken } = require("../middleware/auth");
// All routes require authentication
router.use(authMiddleware.verifyToken);

// Public customer routes
router.get("/available", productController.getAvailableProducts);
router.get("/filter-options", productController.getFilterOptions);
router.get("/my-listings", productController.getSellerListings);
router.get("/:id", productController.getProductById);

// Seller routes
router.post("/list", productController.createListing);
router.put("/:id", productController.updateListing);
router.delete("/:id", productController.deleteListing);

// Retail partner routes
router.get("/pending/verifications", 
    authMiddleware.checkRole('retail', 'admin'), 
    productController.getPendingVerifications
);
router.put("/:id/verify", 
    authMiddleware.checkRole('retail', 'admin'), 
    productController.verifyProduct
);
// ---------------------------------------------------------------
// GET /available  — only verified AND published items
// ---------------------------------------------------------------
router.get("/available", verifyToken, async (req, res) => {
  try {
    const {
      search, category, brand, size, condition,
      priceMin, priceMax, sortBy
    } = req.query;

    let sql = `
      SELECT p.*, u.full_name AS seller_name
      FROM products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.verification_status = 'verified'
        AND p.is_published = TRUE
        AND p.status = 'available'
        AND p.quantity > 0
    `;
    const params = [];

    if (search) {
      sql += " AND (p.name LIKE ? OR p.brand LIKE ? OR p.category LIKE ?)";
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (category && category !== "All") { sql += " AND p.category = ?"; params.push(category); }
    if (brand && brand !== "All")       { sql += " AND p.brand = ?";    params.push(brand); }
    if (size && size !== "All")         { sql += " AND p.size = ?";     params.push(size); }
    if (condition && condition !== "All"){ sql += " AND p.condition_status = ?"; params.push(condition); }
    if (priceMin) { sql += " AND p.price >= ?"; params.push(priceMin); }
    if (priceMax) { sql += " AND p.price <= ?"; params.push(priceMax); }

    switch (sortBy) {
      case "oldest":     sql += " ORDER BY p.created_at ASC"; break;
      case "price-low":  sql += " ORDER BY p.price ASC";      break;
      case "price-high": sql += " ORDER BY p.price DESC";     break;
      default:           sql += " ORDER BY p.created_at DESC";
    }

    const [rows] = await db.query(sql, params);
    res.json({ products: rows });
  } catch (err) {
    console.error("available products error:", err);
    res.status(500).json({ message: "Failed to load products" });
  }
});
module.exports = router;
