const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const authMiddleware = require("../middleware/authMiddleware");

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

module.exports = router;