const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");

// All routes require authentication
router.use(authMiddleware.verifyToken);

// Buyer routes
router.get("/my-orders", orderController.getMyOrders);
router.get("/:id", orderController.getOrderDetails);
router.post("/create", orderController.createOrder);
router.put("/:id/cancel", orderController.cancelOrder);

// Seller routes
router.get("/sales/history", orderController.getSalesHistory);

module.exports = router;