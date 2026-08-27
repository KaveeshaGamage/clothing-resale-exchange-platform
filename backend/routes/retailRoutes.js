const express = require("express");
const router = express.Router();
const retailController = require("../controllers/retailController");
const authMiddleware = require("../middleware/authMiddleware");

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