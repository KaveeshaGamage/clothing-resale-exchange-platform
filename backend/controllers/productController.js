const Product = require("../models/Product");

// Get available products for shop page
exports.getAvailableProducts = (req, res) => {
    const filters = {
        category: req.query.category || "",
        brand: req.query.brand || "",
        size: req.query.size || "",
        condition: req.query.condition || "",
        priceMin: req.query.priceMin || "",
        priceMax: req.query.priceMax || "",
        search: req.query.search || "",
        sortBy: req.query.sortBy || "newest"
    };

    Product.getAvailableProducts(filters, (err, products) => {
        if (err) {
            console.error("Error fetching products:", err);
            return res.status(500).json({ 
                success: false,
                message: "Error fetching products",
                error: err.message 
            });
        }

        res.json({
            success: true,
            products: products,
            count: products.length
        });
    });
};

// Get single product details
exports.getProductById = (req, res) => {
    const productId = req.params.id;

    Product.getProductById(productId, (err, product) => {
        if (err) {
            console.error("Error fetching product:", err);
            return res.status(500).json({ 
                success: false,
                message: "Error fetching product details",
                error: err.message 
            });
        }

        if (!product) {
            return res.status(404).json({ 
                success: false,
                message: "Product not found" 
            });
        }

        res.json({
            success: true,
            product: product
        });
    });
};

// Get seller's own listings (My Listings)
exports.getSellerListings = (req, res) => {
    const sellerId = req.user.id;

    Product.getProductsBySeller(sellerId, (err, products) => {
        if (err) {
            console.error("Error fetching listings:", err);
            return res.status(500).json({ 
                success: false,
                message: "Error fetching your listings",
                error: err.message 
            });
        }

        res.json({
            success: true,
            products: products,
            count: products.length
        });
    });
};

// Create new listing (Sell Item)
exports.createListing = (req, res) => {
    const productData = {
        seller_id: req.user.id,
        name: req.body.name,
        brand: req.body.brand,
        category: req.body.category,
        size: req.body.size,
        color: req.body.color,
        condition_status: req.body.condition_status,
        price: req.body.price,
        original_price: req.body.original_price,
        description: req.body.description,
        receipt_number: req.body.receipt_number,
        order_number: req.body.order_number,
        image_url: req.body.image_url
    };

    // Validation
    const errors = [];
    if (!productData.name) errors.push("Product name is required");
    if (!productData.brand) errors.push("Brand is required");
    if (!productData.category) errors.push("Category is required");
    if (!productData.size) errors.push("Size is required");
    if (!productData.condition_status) errors.push("Condition is required");
    if (!productData.price || productData.price <= 0) errors.push("Valid selling price is required");
    if (!productData.original_price || productData.original_price <= 0) errors.push("Valid original price is required");
    if (parseFloat(productData.price) > parseFloat(productData.original_price)) {
        errors.push("Selling price cannot be higher than original price");
    }
    if (!productData.receipt_number && !productData.order_number) {
        errors.push("Receipt number or order number is required for verification");
    }

    if (errors.length > 0) {
        return res.status(400).json({ 
            success: false,
            message: "Validation failed",
            errors: errors 
        });
    }

    Product.create(productData, (err, result) => {
        if (err) {
            console.error("Error creating listing:", err);
            return res.status(500).json({ 
                success: false,
                message: "Error creating listing",
                error: err.message 
            });
        }

        res.status(201).json({
            success: true,
            message: "Item listed successfully! It will be visible after verification.",
            productId: result.insertId
        });
    });
};

// Update listing
exports.updateListing = (req, res) => {
    const productId = req.params.id;
    const sellerId = req.user.id;
    
    const productData = {
        name: req.body.name,
        brand: req.body.brand,
        category: req.body.category,
        size: req.body.size,
        color: req.body.color,
        condition_status: req.body.condition_status,
        price: req.body.price,
        original_price: req.body.original_price,
        description: req.body.description,
        image_url: req.body.image_url
    };

    Product.update(productId, sellerId, productData, (err, result) => {
        if (err) {
            console.error("Error updating listing:", err);
            return res.status(500).json({ 
                success: false,
                message: "Error updating listing",
                error: err.message 
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                message: "Product not found, already sold, or you don't have permission to edit it" 
            });
        }

        res.json({
            success: true,
            message: "Listing updated successfully"
        });
    });
};

// Delete listing
exports.deleteListing = (req, res) => {
    const productId = req.params.id;
    const sellerId = req.user.id;

    Product.delete(productId, sellerId, (err, result) => {
        if (err) {
            console.error("Error deleting listing:", err);
            return res.status(500).json({ 
                success: false,
                message: "Error removing listing",
                error: err.message 
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                message: "Product not found or already removed" 
            });
        }

        res.json({
            success: true,
            message: "Listing removed successfully"
        });
    });
};

// Get filter options (categories and brands)
exports.getFilterOptions = (req, res) => {
    Product.getCategories((err, categories) => {
        if (err) {
            return res.status(500).json({ 
                success: false,
                message: "Error fetching categories" 
            });
        }

        Product.getBrands((err, brands) => {
            if (err) {
                return res.status(500).json({ 
                    success: false,
                    message: "Error fetching brands" 
                });
            }

            res.json({
                success: true,
                categories: categories,
                brands: brands
            });
        });
    });
};

// Get pending verifications (for retail partner)
exports.getPendingVerifications = (req, res) => {
    // Only retail and admin can access this
    if (req.user.role !== 'retail' && req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false,
            message: "Access denied. Only retail partners can access this." 
        });
    }

    Product.getPendingVerifications((err, products) => {
        if (err) {
            return res.status(500).json({ 
                success: false,
                message: "Error fetching pending verifications" 
            });
        }

        res.json({
            success: true,
            products: products,
            count: products.length
        });
    });
};

// Verify product (for retail partner)
exports.verifyProduct = (req, res) => {
    if (req.user.role !== 'retail' && req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false,
            message: "Access denied" 
        });
    }

    const productId = req.params.id;
    const { status } = req.body; // 'verified' or 'rejected'

    if (!['verified', 'rejected'].includes(status)) {
        return res.status(400).json({ 
            success: false,
            message: "Status must be 'verified' or 'rejected'" 
        });
    }

    Product.updateVerification(productId, status, (err, result) => {
        if (err) {
            return res.status(500).json({ 
                success: false,
                message: "Error updating verification status" 
            });
        }

        res.json({
            success: true,
            message: `Product ${status} successfully`
        });
    });
};