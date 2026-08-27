const db = require("../config/db");

// Get dashboard statistics
exports.getDashboardStats = (req, res) => {
    const stats = {};
    
    // Total users
    db.query("SELECT COUNT(*) as count FROM users", (err, result) => {
        if (err) return res.status(500).json({ message: "Error" });
        stats.totalUsers = result[0].count;
        
        // Total listings
        db.query("SELECT COUNT(*) as count FROM products WHERE status != 'removed'", (err, result) => {
            stats.totalListings = result[0].count;
            
            // Total orders
            db.query("SELECT COUNT(*) as count FROM orders", (err, result) => {
                stats.totalOrders = result[0].count;
                
                // Total revenue
                db.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE order_status != 'cancelled'", (err, result) => {
                    stats.totalRevenue = result[0].total;
                    
                    // Pending verifications
                    db.query("SELECT COUNT(*) as count FROM products WHERE verification_status = 'pending'", (err, result) => {
                        stats.pendingVerifications = result[0].count;
                        
                        // Open complaints
                        db.query("SELECT COUNT(*) as count FROM complaints WHERE status IN ('pending', 'investigating')", (err, result) => {
                            stats.openComplaints = result[0].count;
                            
                            res.json({ success: true, stats });
                        });
                    });
                });
            });
        });
    });
};

// Get all users
exports.getUsers = (req, res) => {
    db.query("SELECT id, fullName, email, phone, role, created_at FROM users ORDER BY created_at DESC", (err, users) => {
        if (err) return res.status(500).json({ message: "Error fetching users" });
        res.json({ success: true, users });
    });
};

// Delete user
exports.deleteUser = (req, res) => {
    const userId = req.params.id;
    db.query("DELETE FROM users WHERE id = ? AND role != 'admin'", [userId], (err, result) => {
        if (err) return res.status(500).json({ message: "Error deleting user" });
        if (result.affectedRows === 0) return res.status(400).json({ message: "Cannot delete admin user" });
        res.json({ success: true, message: "User deleted" });
    });
};

// Update user role
exports.updateUserRole = (req, res) => {
    const userId = req.params.id;
    const { role } = req.body;
    db.query("UPDATE users SET role = ? WHERE id = ?", [role, userId], (err) => {
        if (err) return res.status(500).json({ message: "Error updating role" });
        res.json({ success: true, message: "Role updated" });
    });
};
// Update user details (name, email, phone, role)
exports.updateUser = (req, res) => {
    const userId = req.params.id;
    const { fullName, email, phone, role } = req.body;

    // Validation
    if (!fullName || !email || !phone) {
        return res.status(400).json({ 
            success: false,
            message: "Name, email, and phone are required" 
        });
    }

    // Check if email already exists for another user
    const checkEmailSql = "SELECT id FROM users WHERE email = ? AND id != ?";
    db.query(checkEmailSql, [email, userId], (err, results) => {
        if (err) {
            return res.status(500).json({ 
                success: false,
                message: "Database error" 
            });
        }

        if (results.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: "Email already in use by another user" 
            });
        }

        // Update user
        const updateSql = `
            UPDATE users 
            SET fullName = ?, email = ?, phone = ?, role = ?
            WHERE id = ?
        `;
        
        db.query(updateSql, [fullName, email, phone, role || 'customer', userId], (err, result) => {
            if (err) {
                console.error("Error updating user:", err);
                return res.status(500).json({ 
                    success: false,
                    message: "Error updating user" 
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ 
                    success: false,
                    message: "User not found" 
                });
            }

            res.json({ 
                success: true, 
                message: "User updated successfully" 
            });
        });
    });
};
// Get all listings (admin view)
exports.getListings = (req, res) => {
    const sql = `
        SELECT p.*, u.fullName as seller_name 
        FROM products p 
        JOIN users u ON p.seller_id = u.id 
        ORDER BY p.created_at DESC
    `;
    db.query(sql, (err, listings) => {
        if (err) return res.status(500).json({ message: "Error fetching listings" });
        res.json({ success: true, listings });
    });
};

// Delete listing (admin)
exports.deleteListing = (req, res) => {
    const listingId = req.params.id;
    db.query("DELETE FROM products WHERE id = ?", [listingId], (err) => {
        if (err) return res.status(500).json({ message: "Error deleting listing" });
        res.json({ success: true, message: "Listing deleted" });
    });
};
// Assign listing to retail partner
exports.assignListingToRetail = (req, res) => {
    const listingId = req.params.id;
    const { retail_id, notes } = req.body;

    if (!retail_id) {
        return res.status(400).json({ message: "Retail partner is required" });
    }

    // Verify retail partner exists
    db.query("SELECT id FROM users WHERE id = ? AND role = 'retail'", [retail_id], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        
        if (results.length === 0) {
            return res.status(400).json({ message: "Invalid retail partner" });
        }

        // Update listing with assignment info (you can add assigned_to column if needed)
        const sql = "UPDATE products SET verification_status = 'pending' WHERE id = ?";
        db.query(sql, [listingId], (err) => {
            if (err) return res.status(500).json({ message: "Error assigning listing" });
            
            res.json({ 
                success: true, 
                message: "Listing assigned to retail partner successfully" 
            });
        });
    });
};
// Get transactions
exports.getTransactions = (req, res) => {
    const sql = `
        SELECT t.*, o.order_status, 
               u1.fullName as seller_name, 
               u2.fullName as buyer_name
        FROM transactions t
        JOIN orders o ON t.order_id = o.id
        JOIN users u1 ON t.seller_id = u1.id
        JOIN users u2 ON t.buyer_id = u2.id
        ORDER BY t.created_at DESC
    `;
    db.query(sql, (err, transactions) => {
        if (err) return res.status(500).json({ message: "Error fetching transactions" });
        res.json({ success: true, transactions });
    });
};

// Get complaints
exports.getComplaints = (req, res) => {
    const sql = `
        SELECT c.*, u.fullName as user_name, u.email as user_email
        FROM complaints c
        JOIN users u ON c.user_id = u.id
        ORDER BY 
            CASE c.priority 
                WHEN 'urgent' THEN 1 
                WHEN 'high' THEN 2 
                WHEN 'medium' THEN 3 
                WHEN 'low' THEN 4 
            END,
            c.created_at DESC
    `;
    db.query(sql, (err, complaints) => {
        if (err) return res.status(500).json({ message: "Error fetching complaints" });
        res.json({ success: true, complaints });
    });
};

// Update complaint status
exports.updateComplaint = (req, res) => {
    const complaintId = req.params.id;
    const { status, admin_response } = req.body;
    
    const sql = "UPDATE complaints SET status = ?, admin_response = ?, resolved_at = NOW() WHERE id = ?";
    db.query(sql, [status, admin_response, complaintId], (err) => {
        if (err) return res.status(500).json({ message: "Error updating complaint" });
        res.json({ success: true, message: "Complaint updated" });
    });
};

// Get system settings
exports.getSettings = (req, res) => {
    db.query("SELECT * FROM system_settings", (err, settings) => {
        if (err) return res.status(500).json({ message: "Error fetching settings" });
        res.json({ success: true, settings });
    });
};

// Update system settings
exports.updateSettings = (req, res) => {
    const { settings } = req.body;
    
    let completed = 0;
    const total = settings.length;
    
    settings.forEach(setting => {
        db.query("UPDATE system_settings SET setting_value = ? WHERE setting_key = ?", 
            [setting.value, setting.key], 
            (err) => {
                completed++;
                if (completed === total) {
                    res.json({ success: true, message: "Settings updated" });
                }
            }
        );
    });
};

// Get reports data
exports.getReports = (req, res) => {
    const { period } = req.query; // daily, weekly, monthly
    
    const sql = `
        SELECT 
            DATE(order_date) as date,
            COUNT(*) as orders,
            SUM(total_amount) as revenue,
            SUM(commission) as commission
        FROM orders o
        LEFT JOIN transactions t ON o.id = t.order_id
        WHERE o.order_status != 'cancelled'
        AND o.order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(order_date)
        ORDER BY date DESC
    `;
    
    db.query(sql, (err, reports) => {
        if (err) return res.status(500).json({ message: "Error generating reports" });
        res.json({ success: true, reports });
    });
};