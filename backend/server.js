const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const allowedOrigins = (
    process.env.CORS_ORIGINS ||
    "http://localhost:5174,http://localhost:5173,http://localhost:3000"
).split(",").map((origin) => origin.trim()).filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import Routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const retailRoutes = require("./routes/retailRoutes");
const customerRoutes = require("./routes/customerRoutes");
const cartRoutes = require("./routes/cartRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const messageRoutes = require("./routes/messageRoutes");

app.use(  "/api/messages",messageRoutes);
app.use(  "/api/notifications",  notificationRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/cart", cartRoutes);
// Use Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/retail", retailRoutes);
app.use("/api/customer", customerRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        message: "ReWear API is running",
        timestamp: new Date().toISOString(),
        endpoints: [
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/me",
            "/api/products/available",
            "/api/products/my-listings",
            "/api/products/list",
            "/api/products/filter-options",
            "/api/orders/my-orders",
            "/api/orders/create",
            "/api/customer/my-listings",
            "/api/customer/my-orders",
            "/api/customer/dashboard",
            "/api/customer/retail-partners",             // NEW
            "/api/customer/complaints/mine",
            "/api/customer/complaints",
            "/api/admin/dashboard-stats",
            "/api/admin/users",
            "/api/admin/listings",
            "/api/admin/complaints",
            "/api/admin/complaints/:id/attachments",
            "/api/admin/listings/:id/send-for-approval", // NEW
            "/api/admin/listings/:id/publish",           // NEW
            "/api/retail/pending-verifications",
            "/api/retail/verify/:id",
            "/api/retail/deliveries"
        ]
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        message: "Route not found" 
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 API URL: http://localhost:${PORT}/api`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});