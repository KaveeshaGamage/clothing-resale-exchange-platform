const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware.verifyToken);

// ---------------------------------------------------------------
// GET /api/cart — Get current user's cart
// ---------------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const [items] = await db.promise().query(
      `SELECT c.id, c.product_id, c.quantity, c.added_at,
              p.name, p.brand, p.category, p.size, p.color,
              p.condition_status, p.price, p.original_price,
              p.image_url, p.quantity AS stock_quantity,
              p.status AS product_status,
              u.id AS seller_id, u.fullName AS seller_name
       FROM cart c
       JOIN products p ON c.product_id = p.id
       JOIN users u ON p.seller_id = u.id
       WHERE c.user_id = ?
       ORDER BY c.added_at DESC`,
      [req.user.id]
    );
    res.json({ items });
  } catch (err) {
    console.error("cart fetch error:", err);
    res.status(500).json({ message: "Failed to fetch cart" });
  }
});

// ---------------------------------------------------------------
// POST /api/cart/add — Add item
// ---------------------------------------------------------------
router.post("/add", async (req, res) => {
  const { product_id } = req.body;
  const userId = req.user.id;

  if (!product_id) {
    return res.status(400).json({ message: "product_id is required" });
  }

  let connection;
  try {
    connection = await db.promise().getConnection();
    await connection.beginTransaction();

    const [product] = await connection.query(
      `SELECT id, quantity, seller_id FROM products
       WHERE id = ? AND verification_status = 'verified'
         AND is_published = TRUE AND status = 'available'
       FOR UPDATE`,
      [product_id]
    );

    if (product.length === 0 || product[0].quantity < 1) {
      await connection.rollback();
      return res.status(404).json({ message: "Product not available" });
    }

    if (String(product[0].seller_id) === String(userId)) {
      await connection.rollback();
      return res.status(400).json({ message: "You cannot buy your own item" });
    }

    const [cartItems] = await connection.query(
      "SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ? FOR UPDATE",
      [userId, product_id]
    );

    if (cartItems.length > 0) {
      if (cartItems[0].quantity >= product[0].quantity) {
        await connection.rollback();
        return res.status(400).json({
          message: `Only ${product[0].quantity} item(s) are available`
        });
      }

      await connection.query(
        "UPDATE cart SET quantity = quantity + 1 WHERE id = ?",
        [cartItems[0].id]
      );
    } else {
      await connection.query(
        "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, 1)",
        [userId, product_id]
      );
    }

    await connection.commit();
    res.json({ message: "Added one item to cart" });
  } catch (err) {
    await connection.rollback();
    console.error("cart add error:", err);
    res.status(500).json({ message: "Failed to add to cart" });
  } finally {
    connection.release();
  }
});

// ---------------------------------------------------------------
// PUT /api/cart/update/:id — Change quantity
// ---------------------------------------------------------------
router.put("/update/:id", async (req, res) => {
  const { quantity } = req.body;

  const requestedQuantity = Number(quantity);
  if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
    return res.status(400).json({ message: "Valid quantity is required" });
  }

  try {
    const [result] = await db.promise().query(
      `UPDATE cart c
       JOIN products p ON p.id = c.product_id
       SET c.quantity = ?
       WHERE c.id = ? AND c.user_id = ?
         AND p.status = 'available'
         AND p.verification_status = 'verified'
         AND p.is_published = TRUE
         AND ? <= p.quantity`,
      [requestedQuantity, req.params.id, req.user.id, requestedQuantity]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        message: "Requested quantity exceeds available stock or the item is unavailable"
      });
    }

    res.json({ message: "Cart updated" });
  } catch (err) {
    console.error("cart update error:", err);
    res.status(500).json({ message: "Failed to update cart" });
  }
});

// ---------------------------------------------------------------
// DELETE /api/cart/remove/:id — Remove item
// ---------------------------------------------------------------
router.delete("/remove/:id", async (req, res) => {
  try {
    await db.promise().query(
      "DELETE FROM cart WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    res.json({ message: "Removed from cart" });
  } catch (err) {
    console.error("cart remove error:", err);
    res.status(500).json({ message: "Failed to remove item" });
  }
});

// ---------------------------------------------------------------
// DELETE /api/cart/clear — Empty cart
// ---------------------------------------------------------------
router.delete("/clear", async (req, res) => {
  try {
    await db.promise().query("DELETE FROM cart WHERE user_id = ?", [req.user.id]);
    res.json({ message: "Cart cleared" });
  } catch (err) {
    console.error("cart clear error:", err);
    res.status(500).json({ message: "Failed to clear cart" });
  }
});

// ---------------------------------------------------------------
// POST /api/cart/checkout — Convert cart → orders
// Body: { shipping_address, payment_method }
// ---------------------------------------------------------------
router.post("/checkout", async (req, res) => {
  const {
    shipping_address,
    payment_method = "cash_on_delivery"
  } = req.body;

  const buyerId = req.user.id;

  if (!shipping_address) {
    return res.status(400).json({
      message: "Shipping address is required"
    });
  }

  let connection;
  try {
    connection = await db.promise().getConnection();
    await connection.beginTransaction();

    // =====================================================
    // 1. LOAD CART ITEMS
    // =====================================================
    const [items] = await connection.query(
      `SELECT
          c.id AS cart_id,
          c.quantity,
          c.product_id,
          p.price,
          p.seller_id,
          p.retail_partner_id,
          p.status AS product_status,
          p.quantity AS stock_quantity,
          p.verification_status,
          p.is_published
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?
       ORDER BY p.id
       FOR UPDATE`,
      [buyerId]
    );

    if (items.length === 0) {
      await connection.rollback();

      return res.status(400).json({
        message: "Cart is empty"
      });
    }

    // =====================================================
    // 2. VALIDATE PRODUCTS
    // =====================================================
    for (const item of items) {

      if (item.product_status !== "available" ||
          item.verification_status !== "verified" ||
          !item.is_published ||
          item.stock_quantity < 1) {
        await connection.rollback();

        return res.status(400).json({
          message: `Product #${item.product_id} is no longer available`
        });
      }

      if (item.quantity > item.stock_quantity) {
        await connection.rollback();
        return res.status(400).json({
          message: `Only ${item.stock_quantity} item(s) of product #${item.product_id} remain in stock`
        });
      }

      // Retail partner is required for delivery
      if (!item.retail_partner_id) {
        await connection.rollback();

        return res.status(400).json({
          message:
            `Product #${item.product_id} does not have a retail partner assigned`
        });
      }

      // Prevent seller buying own product
      if (item.seller_id === buyerId) {
        await connection.rollback();

        return res.status(400).json({
          message:
            `You cannot buy your own product #${item.product_id}`
        });
      }
    }

    // =====================================================
    // 3. CALCULATE TOTAL
    // =====================================================
    const total = items.reduce(
      (sum, item) =>
        sum + parseFloat(item.price) * item.quantity,
      0
    );

    // =====================================================
    // 4. CREATE ORDER
    // =====================================================
    const [orderResult] = await connection.query(
      `INSERT INTO orders
        (
          buyer_id,
          total_amount,
          order_status,
          payment_status,
          payment_method,
          shipping_address
        )
       VALUES (?, ?, 'pending', 'pending', ?, ?)`,
      [
        buyerId,
        total,
        payment_method,
        shipping_address
      ]
    );

    const orderId = orderResult.insertId;

    // =====================================================
    // 5. CREATE ORDER ITEMS
    // =====================================================
    for (const item of items) {

      const [orderItemResult] = await connection.query(
        `INSERT INTO order_items
          (
            order_id,
            product_id,
            seller_id,
            price,
            quantity
          )
         VALUES (?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product_id,
          item.seller_id,
          item.price,
          item.quantity
        ]
      );

      const orderItemId = orderItemResult.insertId;

      // ===================================================
      // 6. CREATE DELIVERY
      // ===================================================
      await connection.query(
        `INSERT INTO deliveries
          (
            order_id,
            order_item_id,
            retail_id,
            pickup_address,
            delivery_address,
            delivery_status
          )
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [
          orderId,
          orderItemId,
          item.retail_partner_id,
          "Seller pickup location",
          shipping_address
        ]
      );

      // ===================================================
      // 7. CALCULATE TRANSACTION
      // ===================================================
      const itemAmount =
        parseFloat(item.price) * item.quantity;

      // 10% commission
      const commission =
        itemAmount * 0.10;

      const sellerEarning =
        itemAmount - commission;

      // ===================================================
      // 8. CREATE TRANSACTION
      // ===================================================
      await connection.query(
        `INSERT INTO transactions
          (
            order_id,
            seller_id,
            buyer_id,
            amount,
            commission,
            seller_earning,
            transaction_type,
            status
          )
         VALUES (?, ?, ?, ?, ?, ?, 'sale', 'completed')`,
        [
          orderId,
          item.seller_id,
          buyerId,
          itemAmount,
          commission,
          sellerEarning
        ]
      );

      // ===================================================
      // 9. MARK PRODUCT AS SOLD
      // ===================================================
      const [stockUpdate] = await connection.query(
        `UPDATE products
         SET quantity = quantity - ?,
             status = IF(quantity - ? = 0, 'sold', 'available')
         WHERE id = ? AND status = 'available' AND quantity >= ?`,
        [item.quantity, item.quantity, item.product_id, item.quantity]
      );

      if (stockUpdate.affectedRows !== 1) {
        throw new Error(`Insufficient stock for product #${item.product_id}`);
      }
    }

    // =====================================================
    // 10. CLEAR CART
    // =====================================================
    await connection.query(
      `DELETE FROM cart
       WHERE user_id = ?`,
      [buyerId]
    );

    // =====================================================
    // 11. NOTIFY SELLERS
    // =====================================================
    const sellerIds = [
      ...new Set(items.map(item => item.seller_id))
    ];

    for (const sellerId of sellerIds) {

      await connection.query(
        `INSERT INTO notifications
          (
            user_id,
            message,
            type
          )
         VALUES (?, ?, 'order')`,
        [
          sellerId,
          `You have a new order #${orderId}`
        ]
      );
    }

    // =====================================================
    // 12. NOTIFY RETAIL PARTNERS
    // =====================================================
    const retailIds = [
      ...new Set(
        items.map(item => item.retail_partner_id)
      )
    ];

    for (const retailId of retailIds) {

      await connection.query(
        `INSERT INTO notifications
          (
            user_id,
            message,
            type
          )
         VALUES (?, ?, 'order')`,
        [
          retailId,
          `New delivery assigned for order #${orderId}`
        ]
      );
    }

    // =====================================================
    // 13. COMMIT EVERYTHING
    // =====================================================
    await connection.commit();

    // =====================================================
    // 14. RESPONSE
    // =====================================================
    res.json({
      message: "Order placed successfully",
      order_id: orderId,
      total
    });

  } catch (err) {

    if (connection) {
      await connection.rollback();
    }

    console.error(
      "checkout error:",
      err
    );

    res.status(500).json({
      message: err.code === "ER_BAD_FIELD_ERROR"
        ? "Checkout failed because the database schema is missing a required field. Apply the latest database migrations and retry."
        : "Checkout failed",
      error_code: err.code || "CHECKOUT_ERROR"
    });

  } finally {

    if (connection) {
      connection.release();
    }
  }
});

module.exports = router;