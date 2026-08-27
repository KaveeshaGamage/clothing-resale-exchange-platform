const db = require("../config/db");

// Dashboard Stats
exports.getDashboardStats = (req, res) => {
    const retailId = req.user.id;
    const stats = {};
    
    // Pending verifications
    db.query("SELECT COUNT(*) as count FROM products WHERE verification_status = 'pending'", (err, result) => {
        stats.pendingVerifications = result[0].count;
        
        // Approved today
        db.query("SELECT COUNT(*) as count FROM products WHERE verification_status = 'verified' AND DATE(updated_at) = CURDATE()", (err, result) => {
            stats.approvedToday = result[0].count;
            
            // Active deliveries
            db.query("SELECT COUNT(*) as count FROM deliveries WHERE delivery_status IN ('pending', 'picked_up', 'in_transit', 'out_for_delivery') AND retail_id = ?", [retailId], (err, result) => {
                stats.activeDeliveries = result[0].count;
                
                // Delivered today
                db.query("SELECT COUNT(*) as count FROM deliveries WHERE delivery_status = 'delivered' AND retail_id = ? AND DATE(updated_at) = CURDATE()", [retailId], (err, result) => {
                    stats.deliveredToday = result[0].count;
                    res.json({ success: true, stats });
                });
            });
        });
    });
};

// Get pending verifications
exports.getPendingVerifications = (req, res) => {
    const sql = `
        SELECT p.*, u.fullName as seller_name, u.email as seller_email
        FROM products p
        JOIN users u ON p.seller_id = u.id
        WHERE p.verification_status = 'pending'
        ORDER BY p.created_at ASC
    `;
    db.query(sql, (err, listings) => {
        if (err) return res.status(500).json({ message: "Error" });
        res.json({ success: true, listings });
    });
};

// Verify/Reject listing
exports.verifyListing = (req, res) => {
    const productId = req.params.id;
    const retailId = req.user.id;
    const { status, notes } = req.body;
    
    if (!['verified', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }
    
    // Update product verification status
    db.query("UPDATE products SET verification_status = ? WHERE id = ?", [status, productId], (err) => {
        if (err) return res.status(500).json({ message: "Error updating product" });
        
        // Add verification note
        db.query("INSERT INTO verification_notes (product_id, retail_id, notes, action) VALUES (?, ?, ?, ?)", 
            [productId, retailId, notes, status], 
            (err) => {
                if (err) return res.status(500).json({ message: "Error saving notes" });
                res.json({ success: true, message: `Listing ${status}` });
            }
        );
    });
};

// Get approved listings
exports.getApprovedListings = (req, res) => {
    const sql = `
        SELECT p.*, u.fullName as seller_name
        FROM products p
        JOIN users u ON p.seller_id = u.id
        WHERE p.verification_status = 'verified'
        ORDER BY p.updated_at DESC
    `;
    db.query(sql, (err, listings) => {
        if (err) return res.status(500).json({ message: "Error" });
        res.json({ success: true, listings });
    });
};

// Get rejected listings
exports.getRejectedListings = (req, res) => {
    const sql = `
        SELECT p.*, u.fullName as seller_name, vn.notes as rejection_reason
        FROM products p
        JOIN users u ON p.seller_id = u.id
        LEFT JOIN verification_notes vn ON p.id = vn.product_id AND vn.action = 'rejected'
        WHERE p.verification_status = 'rejected'
        ORDER BY p.updated_at DESC
    `;
    db.query(sql, (err, listings) => {
        if (err) return res.status(500).json({ message: "Error" });
        res.json({ success: true, listings });
    });
};

// Get deliveries
exports.getDeliveries = (req, res) => {
    const retailId = req.user.id;
    const sql = `
        SELECT d.*, oi.product_id, p.name as product_name, 
               u.fullName as buyer_name, u.phone as buyer_phone
        FROM deliveries d
        JOIN order_items oi ON d.order_item_id = oi.id
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON d.order_id = o.id
        JOIN users u ON o.buyer_id = u.id
        WHERE d.retail_id = ?
        ORDER BY d.created_at DESC
    `;
    db.query(sql, [retailId], (err, deliveries) => {
        if (err) return res.status(500).json({ message: "Error" });
        res.json({ success: true, deliveries });
    });
};

// Update delivery status
exports.updateDeliveryStatus = (req, res) => {
    const deliveryId = req.params.id;
    const { status, tracking_number, notes } = req.body;
    
    const sql = `
        UPDATE deliveries 
        SET delivery_status = ?, tracking_number = ?, delivery_notes = ?,
            actual_delivery_date = IF(? = 'delivered', NOW(), actual_delivery_date)
        WHERE id = ?
    `;
    
    db.query(sql, [status, tracking_number, notes, status, deliveryId], (err) => {
        if (err) return res.status(500).json({ message: "Error updating delivery" });
        
        // If delivered, update order status
        if (status === 'delivered') {
            db.query("UPDATE orders o JOIN deliveries d ON o.id = d.order_id SET o.order_status = 'delivered', o.delivery_date = NOW() WHERE d.id = ?", 
                [deliveryId]);
        }
        
        res.json({ success: true, message: "Delivery status updated" });
    });
};
// Get single delivery details
exports.getDeliveryDetails = (req, res) => {
    const deliveryId = req.params.id;
    
    const sql = `
        SELECT 
            d.*,
            oi.product_id,
            p.name as product_name,
            p.brand,
            p.image_url as product_image,
            u.fullName as buyer_name,
            u.phone as buyer_phone,
            u.email as buyer_email,
            o.total_amount as order_total,
            o.order_status,
            o.payment_status
        FROM deliveries d
        JOIN order_items oi ON d.order_item_id = oi.id
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON d.order_id = o.id
        JOIN users u ON o.buyer_id = u.id
        WHERE d.id = ?
    `;
    
    db.query(sql, [deliveryId], (err, results) => {
        if (err) {
            console.error("Error fetching delivery:", err);
            return res.status(500).json({ message: "Error fetching delivery details" });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: "Delivery not found" });
        }
        
        res.json({ success: true, delivery: results[0] });
    });
};

// Update full delivery details
exports.updateDeliveryDetails = (req, res) => {
    const deliveryId = req.params.id;
    const { 
        delivery_status, 
        tracking_number, 
        courier_name, 
        estimated_delivery_date,
        delivery_notes,
        pickup_address,
        delivery_address 
    } = req.body;
    
    const sql = `
        UPDATE deliveries 
        SET 
            delivery_status = ?,
            tracking_number = ?,
            courier_name = ?,
            estimated_delivery_date = ?,
            delivery_notes = ?,
            pickup_address = ?,
            delivery_address = ?,
            actual_delivery_date = IF(? = 'delivered', NOW(), actual_delivery_date)
        WHERE id = ?
    `;
    
    db.query(sql, [
        delivery_status,
        tracking_number,
        courier_name,
        estimated_delivery_date || null,
        delivery_notes,
        pickup_address,
        delivery_address,
        delivery_status,
        deliveryId
    ], (err, result) => {
        if (err) {
            console.error("Error updating delivery:", err);
            return res.status(500).json({ message: "Error updating delivery" });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Delivery not found" });
        }
        
        // If delivered, update order status
        if (delivery_status === 'delivered') {
            db.query(
                "UPDATE orders o JOIN deliveries d ON o.id = d.order_id SET o.order_status = 'delivered', o.delivery_date = NOW() WHERE d.id = ?",
                [deliveryId]
            );
        }
        
        // If failed, update order notes
        if (delivery_status === 'failed') {
            db.query(
                "UPDATE orders o JOIN deliveries d ON o.id = d.order_id SET o.order_status = 'confirmed' WHERE d.id = ?",
                [deliveryId]
            );
        }
        
        res.json({ 
            success: true, 
            message: "Delivery updated successfully" 
        });
    });
};

// Quick status update (for the delivery management page)
exports.updateDeliveryStatus = (req, res) => {
    const deliveryId = req.params.id;
    const { status, tracking_number, notes } = req.body;
    
    const sql = `
        UPDATE deliveries 
        SET 
            delivery_status = ?,
            tracking_number = COALESCE(?, tracking_number),
            delivery_notes = COALESCE(?, delivery_notes),
            actual_delivery_date = IF(? = 'delivered', NOW(), actual_delivery_date)
        WHERE id = ?
    `;
    
    db.query(sql, [status, tracking_number, notes, status, deliveryId], (err, result) => {
        if (err) {
            console.error("Error updating delivery status:", err);
            return res.status(500).json({ message: "Error updating delivery status" });
        }
        
        if (status === 'delivered') {
            db.query(
                "UPDATE orders o JOIN deliveries d ON o.id = d.order_id SET o.order_status = 'delivered', o.delivery_date = NOW() WHERE d.id = ?",
                [deliveryId]
            );
        }
        
        res.json({ success: true, message: "Delivery status updated" });
    });
};

// Create delivery for an order
exports.createDelivery = (req, res) => {
    const retailId = req.user.id;
    const { order_id, order_item_id, pickup_address, delivery_address } = req.body;
    
    // Generate tracking number
    const trackingNumber = 'TRK-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    
    const sql = `
        INSERT INTO deliveries 
        (order_id, order_item_id, retail_id, pickup_address, delivery_address, tracking_number)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    db.query(sql, [order_id, order_item_id, retailId, pickup_address, delivery_address, trackingNumber], (err, result) => {
        if (err) {
            console.error("Error creating delivery:", err);
            return res.status(500).json({ message: "Error creating delivery" });
        }
        
        res.status(201).json({
            success: true,
            message: "Delivery created successfully",
            deliveryId: result.insertId,
            trackingNumber: trackingNumber
        });
    });
};
// Retail reports
exports.getReports = (req, res) => {
    const retailId = req.user.id;
    
    const sql = `
        SELECT 
            DATE(d.created_at) as date,
            COUNT(*) as total_deliveries,
            SUM(CASE WHEN d.delivery_status = 'delivered' THEN 1 ELSE 0 END) as delivered,
            SUM(CASE WHEN d.delivery_status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM deliveries d
        WHERE d.retail_id = ?
        GROUP BY DATE(d.created_at)
        ORDER BY date DESC
        LIMIT 30
    `;
    
    db.query(sql, [retailId], (err, reports) => {
        if (err) return res.status(500).json({ message: "Error" });
        res.json({ success: true, reports });
    });
};