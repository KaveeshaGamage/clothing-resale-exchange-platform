const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");

// Protect all routes
router.use(authMiddleware.verifyToken);

// My Listings (products I'm selling)
router.get("/my-listings", productController.getSellerListings);

// My Orders (products I bought)
router.get("/my-orders", orderController.getMyOrders);

module.exports = router;