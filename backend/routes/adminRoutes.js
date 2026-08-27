const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");

// All routes require admin authentication
router.use(authMiddleware.verifyToken);
router.use(authMiddleware.checkRole('admin'));

// Dashboard
router.get("/dashboard-stats", adminController.getDashboardStats);

// Users
router.get("/users", adminController.getUsers);
router.delete("/users/:id", adminController.deleteUser);
router.put("/users/:id/role", adminController.updateUserRole);

// Listings
router.get("/listings", adminController.getListings);
router.delete("/listings/:id", adminController.deleteListing);

// Transactions
router.get("/transactions", adminController.getTransactions);

// Complaints
router.get("/complaints", adminController.getComplaints);
router.put("/complaints/:id", adminController.updateComplaint);

// Settings
router.get("/settings", adminController.getSettings);
router.put("/settings", adminController.updateSettings);

// Reports
router.get("/reports", adminController.getReports);
// Assign listing to retail partner
router.put("/listings/:id/assign", adminController.assignListingToRetail);
router.put("/users/:id", adminController.updateUser);
module.exports = router;