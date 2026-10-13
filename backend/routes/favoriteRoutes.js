const express = require("express");
const router = express.Router();

const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware.verifyToken);

// =====================================================
// GET /api/favorites
// Get current user's wishlist
// =====================================================
router.get("/", async (req, res) => {
  try {
    const [favorites] = await db.promise().query(
      `SELECT
          f.id,
          f.product_id,
          f.added_at,

          p.name,
          p.brand,
          p.category,
          p.size,
          p.color,
          p.condition_status,
          p.price,
          p.original_price,
          p.image_url,
          p.status AS product_status,
          p.verification_status

       FROM favorites f

       INNER JOIN products p
          ON f.product_id = p.id

       WHERE f.user_id = ?

       ORDER BY f.added_at DESC`,
      [req.user.id]
    );

    res.json({
      favorites
    });

  } catch (err) {
    console.error("get favorites error:", err);

    res.status(500).json({
      message: "Failed to fetch wishlist"
    });
  }
});

// =====================================================
// POST /api/favorites/add
// Add product to wishlist
// =====================================================
router.post("/add", async (req, res) => {
  const { product_id } = req.body;

  if (!product_id) {
    return res.status(400).json({
      message: "product_id is required"
    });
  }

  try {

    const [product] = await db.promise().query(
      `SELECT id
       FROM products
       WHERE id = ?`,
      [product_id]
    );

    if (product.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    await db.promise().query(
      `INSERT INTO favorites
        (user_id, product_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE product_id = product_id`,
      [
        req.user.id,
        product_id
      ]
    );

    res.json({
      message: "Added to wishlist"
    });

  } catch (err) {
    console.error("add favorite error:", err);

    res.status(500).json({
      message: "Failed to add to wishlist"
    });
  }
});

// =====================================================
// DELETE /api/favorites/remove/:id
// =====================================================
router.delete("/remove/:id", async (req, res) => {
  try {

    await db.promise().query(
      `DELETE FROM favorites
       WHERE id = ?
       AND user_id = ?`,
      [
        req.params.id,
        req.user.id
      ]
    );

    res.json({
      message: "Removed from wishlist"
    });

  } catch (err) {
    console.error("remove favorite error:", err);

    res.status(500).json({
      message: "Failed to remove from wishlist"
    });
  }
});

module.exports = router;