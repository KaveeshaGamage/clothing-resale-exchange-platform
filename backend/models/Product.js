const db = require("../config/db");

const Product = {
    // Create new product listing
    create: (productData, callback) => {
        const sql = `
            INSERT INTO products 
            (seller_id, name, brand, category, size, color, condition_status, 
             price, original_price, description, receipt_number, order_number, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
            productData.seller_id,
            productData.name,
            productData.brand,
            productData.category,
            productData.size,
            productData.color || null,
            productData.condition_status,
            productData.price,
            productData.original_price,
            productData.description || null,
            productData.receipt_number || null,
            productData.order_number || null,
            productData.image_url || null
        ];

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error("Create product error:", err);
                return callback(err, null);
            }
            callback(null, result);
        });
    },

    // Get products by seller ID (My Listings) - FIXED (no product_views table)
    getProductsBySeller: (sellerId, callback) => {
        const sql = `
            SELECT 
                p.*,
                u.fullName as seller_name,
                u.email as seller_email
            FROM products p
            JOIN users u ON p.seller_id = u.id
            WHERE p.seller_id = ?
            ORDER BY p.created_at DESC
        `;
        
        db.query(sql, [sellerId], (err, results) => {
            if (err) {
                console.error("Get seller products error:", err);
                return callback(err, null);
            }
            callback(null, results);
        });
    },

    // Get all available products with filters
    getAvailableProducts: (filters, callback) => {
        let sql = `
            SELECT 
                p.*,
                u.fullName as seller_name,
                u.email as seller_email
            FROM products p
            JOIN users u ON p.seller_id = u.id
            WHERE p.status = 'available' 
            AND p.verification_status = 'verified'
        `;
        
        const params = [];

        if (filters.category && filters.category !== "All" && filters.category !== "") {
            sql += " AND p.category = ?";
            params.push(filters.category);
        }

        if (filters.brand && filters.brand !== "All" && filters.brand !== "") {
            sql += " AND p.brand = ?";
            params.push(filters.brand);
        }

        if (filters.size && filters.size !== "All" && filters.size !== "") {
            sql += " AND p.size = ?";
            params.push(filters.size);
        }

        if (filters.condition && filters.condition !== "All" && filters.condition !== "") {
            sql += " AND p.condition_status = ?";
            params.push(filters.condition);
        }

        if (filters.search) {
            sql += " AND (p.name LIKE ? OR p.brand LIKE ? OR p.category LIKE ? OR p.description LIKE ?)";
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (filters.priceMin) {
            sql += " AND p.price >= ?";
            params.push(parseFloat(filters.priceMin));
        }
        if (filters.priceMax) {
            sql += " AND p.price <= ?";
            params.push(parseFloat(filters.priceMax));
        }

        switch (filters.sortBy) {
            case "price-low":
                sql += " ORDER BY p.price ASC";
                break;
            case "price-high":
                sql += " ORDER BY p.price DESC";
                break;
            case "newest":
                sql += " ORDER BY p.created_at DESC";
                break;
            case "oldest":
                sql += " ORDER BY p.created_at ASC";
                break;
            default:
                sql += " ORDER BY p.created_at DESC";
        }

        db.query(sql, params, (err, results) => {
            if (err) {
                console.error("Get available products error:", err);
                return callback(err, null);
            }
            callback(null, results);
        });
    },

    // Get product by ID
    getProductById: (id, callback) => {
        const sql = `
            SELECT 
                p.*,
                u.fullName as seller_name,
                u.email as seller_email,
                u.phone as seller_phone
            FROM products p
            JOIN users u ON p.seller_id = u.id
            WHERE p.id = ?
        `;
        
        db.query(sql, [id], (err, results) => {
            if (err) {
                console.error("Get product by ID error:", err);
                return callback(err, null);
            }
            callback(null, results[0] || null);
        });
    },

    // Update product
    update: (id, sellerId, productData, callback) => {
        const sql = `
            UPDATE products 
            SET name = ?, brand = ?, category = ?, size = ?, color = ?,
                condition_status = ?, price = ?, original_price = ?, 
                description = ?, image_url = ?
            WHERE id = ? AND seller_id = ? AND status = 'available'
        `;
        
        db.query(sql, [
            productData.name,
            productData.brand,
            productData.category,
            productData.size,
            productData.color,
            productData.condition_status,
            productData.price,
            productData.original_price,
            productData.description,
            productData.image_url,
            id,
            sellerId
        ], (err, result) => {
            if (err) {
                console.error("Update product error:", err);
                return callback(err, null);
            }
            callback(null, result);
        });
    },

    // Delete product (soft delete)
    delete: (id, sellerId, callback) => {
        const sql = `
            UPDATE products 
            SET status = 'removed' 
            WHERE id = ? AND seller_id = ? AND status = 'available'
        `;
        
        db.query(sql, [id, sellerId], (err, result) => {
            if (err) {
                console.error("Delete product error:", err);
                return callback(err, null);
            }
            callback(null, result);
        });
    },

    // Get distinct categories
    getCategories: (callback) => {
        const sql = `
            SELECT DISTINCT category 
            FROM products 
            WHERE status = 'available' AND verification_status = 'verified'
            ORDER BY category
        `;
        
        db.query(sql, (err, results) => {
            if (err) {
                console.error("Get categories error:", err);
                return callback(err, null);
            }
            const categories = results.map(r => r.category);
            callback(null, categories);
        });
    },

    // Get distinct brands
    getBrands: (callback) => {
        const sql = `
            SELECT DISTINCT brand 
            FROM products 
            WHERE status = 'available' AND verification_status = 'verified'
            ORDER BY brand
        `;
        
        db.query(sql, (err, results) => {
            if (err) {
                console.error("Get brands error:", err);
                return callback(err, null);
            }
            const brands = results.map(r => r.brand);
            callback(null, brands);
        });
    },

    // Get pending verifications (for retail)
    getPendingVerifications: (callback) => {
        const sql = `
            SELECT 
                p.*,
                u.fullName as seller_name,
                u.email as seller_email
            FROM products p
            JOIN users u ON p.seller_id = u.id
            WHERE p.verification_status = 'pending'
            ORDER BY p.created_at ASC
        `;
        
        db.query(sql, (err, results) => {
            if (err) {
                console.error("Get pending verifications error:", err);
                return callback(err, null);
            }
            callback(null, results);
        });
    },

    // Update verification status
    updateVerification: (id, status, callback) => {
        const sql = "UPDATE products SET verification_status = ? WHERE id = ?";
        db.query(sql, [status, id], (err, result) => {
            if (err) return callback(err, null);
            callback(null, result);
        });
    }
};

module.exports = Product;