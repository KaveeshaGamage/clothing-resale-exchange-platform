const db = require("../config/db");

const syncOrderStatusFromDeliveries = (deliveryId, callback) => {
    db.query(
        `UPDATE orders o
         JOIN (
             SELECT order_id,
                    COUNT(*) AS delivery_count,
                    SUM(delivery_status = 'delivered') AS delivered_count,
                    SUM(delivery_status IN
                        ('picked_up', 'in_transit', 'out_for_delivery')) AS active_count,
                    SUM(delivery_status = 'failed') AS failed_count
             FROM deliveries
             WHERE order_id = (SELECT order_id FROM deliveries WHERE id = ?)
             GROUP BY order_id
         ) d ON d.order_id = o.id
         SET o.order_status = CASE
                 WHEN d.delivery_count > 0 AND d.delivered_count = d.delivery_count
                     THEN 'delivered'
                 WHEN d.active_count > 0 OR d.delivered_count > 0
                     THEN 'shipped'
                 WHEN d.failed_count > 0
                     THEN 'confirmed'
                 ELSE 'pending'
             END,
             o.delivery_date = IF(
                 d.delivery_count > 0 AND d.delivered_count = d.delivery_count,
                 COALESCE(o.delivery_date, NOW()),
                 o.delivery_date
             )
         WHERE o.order_status <> 'cancelled'`,
        [deliveryId],
        callback
    );
};

// Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    const retailId = req.user.id;
    try {
        const [[statsRows], [recentListings], [recentDeliveries]] = await Promise.all([
            db.promise().query(
                `SELECT
                    (SELECT COUNT(*) FROM products
                     WHERE retail_partner_id = ? AND verification_status = 'pending') AS pendingVerifications,
                    (SELECT COUNT(*) FROM products
                     WHERE retail_partner_id = ? AND verification_status = 'verified'
                       AND DATE(updated_at) = CURDATE()) AS approvedToday,
                    (SELECT COUNT(*) FROM deliveries
                     WHERE retail_id = ? AND delivery_status IN
                       ('pending', 'picked_up', 'in_transit', 'out_for_delivery')) AS activeDeliveries,
                    (SELECT COUNT(*) FROM deliveries
                     WHERE retail_id = ? AND delivery_status = 'delivered'
                       AND DATE(updated_at) = CURDATE()) AS deliveredToday`,
                [retailId, retailId, retailId, retailId]
            ),
            db.promise().query(
                `SELECT p.id, p.name, p.brand, p.image_url, p.verification_status, p.created_at,
                        u.fullName AS seller_name
                 FROM products p
                 JOIN users u ON u.id = p.seller_id
                 WHERE p.retail_partner_id = ?
                 ORDER BY p.updated_at DESC
                 LIMIT 6`,
                [retailId]
            ),
            db.promise().query(
                `SELECT d.id, d.order_id, d.delivery_status, d.created_at,
                        p.name AS product_name, u.fullName AS buyer_name
                 FROM deliveries d
                 JOIN order_items oi ON oi.id = d.order_item_id
                 JOIN products p ON p.id = oi.product_id
                 JOIN orders o ON o.id = d.order_id
                 JOIN users u ON u.id = o.buyer_id
                 WHERE d.retail_id = ?
                 ORDER BY d.created_at DESC
                 LIMIT 5`,
                [retailId]
            ),
        ]);

        res.json({
            success: true,
            stats: statsRows[0],
            recentListings,
            recentDeliveries,
        });
    } catch (err) {
        console.error("Error fetching retail dashboard:", err);
        res.status(500).json({ message: "Error fetching dashboard data" });
    }
};

// Get pending verifications
exports.getPendingVerifications = (req, res) => {
    const retailFilter = req.user.role === "retail" ? "AND p.retail_partner_id = ?" : "";
    const params = req.user.role === "retail" ? [req.user.id] : [];
    const sql = `
        SELECT p.*, u.fullName as seller_name, u.email as seller_email
        FROM products p
        JOIN users u ON p.seller_id = u.id
        WHERE p.verification_status = 'pending'
        ${retailFilter}
        ORDER BY p.created_at ASC
    `;
    db.query(sql, params, (err, listings) => {
        if (err) {
            console.error("Error fetching pending verifications:", err);
            return res.status(500).json({ message: "Error fetching pending verifications" });
        }
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
    
    const updateListing = () => {
        db.query(
            "UPDATE products SET verification_status = ? WHERE id = ?",
            [status, productId],
            (err) => {
                if (err) {
                    console.error("Error updating product verification:", err);
                    return res.status(500).json({ message: "Error updating product" });
                }

                db.query(
                    "INSERT INTO verification_notes (product_id, retail_id, notes, action) VALUES (?, ?, ?, ?)",
                    [productId, retailId, notes || null, status],
                    (noteError) => {
                        if (noteError) {
                            console.error("Error saving verification notes:", noteError);
                            return res.status(500).json({ message: "Error saving verification notes" });
                        }
                        res.json({ success: true, message: `Listing ${status}` });
                    }
                );
            }
        );
    };

    if (req.user.role !== "retail") {
        updateListing();
        return;
    }

    db.query(
        "SELECT id FROM products WHERE id = ? AND retail_partner_id = ?",
        [productId, retailId],
        (err, listings) => {
            if (err) {
                console.error("Error checking listing assignment:", err);
                return res.status(500).json({ message: "Error checking listing assignment" });
            }
            if (listings.length === 0) {
                return res.status(404).json({ message: "Listing not found for this retail partner" });
            }
            updateListing();
        }
    );
};

// Get approved listings
exports.getApprovedListings = (req, res) => {
    const retailFilter = req.user.role === "retail" ? "AND p.retail_partner_id = ?" : "";
    const params = req.user.role === "retail" ? [req.user.id] : [];
    const sql = `
        SELECT p.*, u.fullName as seller_name
        FROM products p
        JOIN users u ON p.seller_id = u.id
        WHERE p.verification_status = 'verified'
        ${retailFilter}
        ORDER BY p.updated_at DESC
    `;
    db.query(sql, params, (err, listings) => {
        if (err) {
            console.error("Error fetching approved listings:", err);
            return res.status(500).json({ message: "Error fetching approved listings" });
        }
        res.json({ success: true, listings });
    });
};

// Get rejected listings
exports.getRejectedListings = (req, res) => {
    const retailFilter = req.user.role === "retail" ? "AND p.retail_partner_id = ?" : "";
    const params = req.user.role === "retail" ? [req.user.id] : [];
    const sql = `
        SELECT p.*, u.fullName as seller_name, vn.notes as rejection_reason
        FROM products p
        JOIN users u ON p.seller_id = u.id
        LEFT JOIN verification_notes vn ON p.id = vn.product_id AND vn.action = 'rejected'
        WHERE p.verification_status = 'rejected'
        ${retailFilter}
        ORDER BY p.updated_at DESC
    `;
    db.query(sql, params, (err, listings) => {
        if (err) {
            console.error("Error fetching rejected listings:", err);
            return res.status(500).json({ message: "Error fetching rejected listings" });
        }
        res.json({ success: true, listings });
    });
};

// Get deliveries
exports.getDeliveries = (req, res) => {
    const retailId = req.user.id;
    const sql = `
        SELECT d.id, d.order_id, d.order_item_id, d.retail_id,
               d.pickup_address, d.delivery_address,
               CASE WHEN o.order_status = 'cancelled' THEN 'cancelled' ELSE d.delivery_status END AS delivery_status,
               d.tracking_number, d.courier_name, d.estimated_delivery_date,
               d.actual_delivery_date, d.delivery_notes, d.created_at, d.updated_at,
               o.order_status, oi.product_id, p.name as product_name,
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

    const allowedStatuses = ["pending", "picked_up", "in_transit", "out_for_delivery", "delivered", "failed"];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "A valid delivery status is required" });
    }
    
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
        ${req.user.role === "retail" ? "AND d.retail_id = ?" : ""}
    `;
    const queryParams = req.user.role === "retail"
        ? [deliveryId, req.user.id]
        : [deliveryId];

    db.query(sql, queryParams, (err, results) => {
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

    const allowedStatuses = ["pending", "picked_up", "in_transit", "out_for_delivery", "delivered", "failed"];
    if (!allowedStatuses.includes(delivery_status)) {
        return res.status(400).json({ message: "A valid delivery status is required" });
    }
    
    const sql = `
        UPDATE deliveries d
        JOIN orders o ON o.id = d.order_id
        SET 
            d.delivery_status = ?,
            d.tracking_number = ?,
            d.courier_name = ?,
            d.estimated_delivery_date = ?,
            d.delivery_notes = ?,
            d.pickup_address = ?,
            d.delivery_address = ?,
            d.actual_delivery_date = IF(? = 'delivered', NOW(), d.actual_delivery_date)
        WHERE d.id = ?
          AND o.order_status <> 'cancelled'
          AND d.delivery_status <> 'cancelled'
        ${req.user.role === "retail" ? "AND d.retail_id = ?" : ""}
    `;
    const queryParams = [
        delivery_status,
        tracking_number?.trim() || null,
        courier_name?.trim() || null,
        estimated_delivery_date || null,
        delivery_notes?.trim() || null,
        pickup_address?.trim() || null,
        delivery_address?.trim() || null,
        delivery_status,
        deliveryId
    ];
    if (req.user.role === "retail") {
        queryParams.push(req.user.id);
    }

    db.query(sql, queryParams, (err, result) => {
        if (err) {
            console.error("Error updating delivery:", err);
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    message: "That tracking number is already assigned to another delivery"
                });
            }
            return res.status(500).json({ message: "Error updating delivery" });
        }
        
        if (result.affectedRows === 0) {
            return db.query(
                `SELECT o.order_status, d.delivery_status
                 FROM deliveries d JOIN orders o ON o.id = d.order_id
                 WHERE d.id = ? ${req.user.role === "retail" ? "AND d.retail_id = ?" : ""}`,
                req.user.role === "retail" ? [deliveryId, req.user.id] : [deliveryId],
                (checkError, rows) => {
                    if (checkError) {
                        console.error("Error checking delivery after update:", checkError);
                        return res.status(500).json({ message: "Could not verify delivery status" });
                    }
                    if (!rows.length) {
                        return res.status(404).json({ message: "Delivery not found" });
                    }
                    if (rows[0].order_status === "cancelled" || rows[0].delivery_status === "cancelled") {
                        return res.status(409).json({ message: "This order was cancelled; its delivery can no longer be updated" });
                    }
                    return res.status(409).json({ message: "Delivery was not changed" });
                }
            );
        }
        
        syncOrderStatusFromDeliveries(deliveryId, (statusError) => {
            if (statusError) {
                console.error("Error syncing order status from delivery:", statusError);
                return res.status(500).json({ message: "Delivery updated but order status could not be synchronized" });
            }

            res.json({
                success: true,
                message: "Delivery updated successfully"
            });
        });
    });
};

// Quick status update (for the delivery management page)
exports.updateDeliveryStatus = (req, res) => {
    const deliveryId = req.params.id;
    const { status, tracking_number, notes } = req.body;

    const allowedStatuses = ["pending", "picked_up", "in_transit", "out_for_delivery", "delivered", "failed"];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "A valid delivery status is required" });
    }

    const sql = `
        UPDATE deliveries d
        JOIN orders o ON o.id = d.order_id
        SET 
            d.delivery_status = ?,
            d.tracking_number = COALESCE(?, d.tracking_number),
            d.delivery_notes = COALESCE(?, d.delivery_notes),
            d.actual_delivery_date = IF(? = 'delivered', NOW(), d.actual_delivery_date)
        WHERE d.id = ?
          AND o.order_status <> 'cancelled'
          AND d.delivery_status <> 'cancelled'
        ${req.user.role === "retail" ? "AND d.retail_id = ?" : ""}
    `;

    const queryParams = [status, tracking_number?.trim() || null, notes?.trim() || null, status, deliveryId];
    if (req.user.role === "retail") queryParams.push(req.user.id);
    db.query(sql, queryParams, (err, result) => {
        if (err) {
            console.error("Error updating delivery status:", err);
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    message: "That tracking number is already assigned to another delivery"
                });
            }
            return res.status(500).json({ message: "Error updating delivery status" });
        }

        if (result.affectedRows === 0) {
            return db.query(
                `SELECT o.order_status, d.delivery_status
                 FROM deliveries d JOIN orders o ON o.id = d.order_id
                 WHERE d.id = ? ${req.user.role === "retail" ? "AND d.retail_id = ?" : ""}`,
                req.user.role === "retail" ? [deliveryId, req.user.id] : [deliveryId],
                (checkError, rows) => {
                    if (checkError) {
                        console.error("Error checking delivery after update:", checkError);
                        return res.status(500).json({ message: "Could not verify delivery status" });
                    }
                    if (!rows.length) {
                        return res.status(404).json({ message: "Delivery not found" });
                    }
                    if (rows[0].order_status === "cancelled" || rows[0].delivery_status === "cancelled") {
                        return res.status(409).json({ message: "This order was cancelled; its delivery can no longer be updated" });
                    }
                    return res.status(409).json({ message: "Delivery was not changed" });
                }
            );
        }
        
        syncOrderStatusFromDeliveries(deliveryId, (statusError) => {
            if (statusError) {
                console.error("Error syncing order status from delivery:", statusError);
                return res.status(500).json({ message: "Delivery updated but order status could not be synchronized" });
            }

            res.json({ success: true, message: "Delivery status updated" });
        });
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