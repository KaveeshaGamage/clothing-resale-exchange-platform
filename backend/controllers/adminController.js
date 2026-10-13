const db = require("../config/db");
const bcrypt = require("bcrypt");

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
    try {
        const [[statsRows], [recentUsers], [recentListings], [dailySales]] = await Promise.all([
            db.promise().query(`
                SELECT
                    (SELECT COUNT(*) FROM users) AS totalUsers,
                    (SELECT COUNT(*) FROM products WHERE status <> 'removed') AS totalListings,
                    (SELECT COUNT(*) FROM orders) AS totalOrders,
                    (SELECT COALESCE(SUM(total_amount), 0) FROM orders
                        WHERE order_status <> 'cancelled') AS totalRevenue,
                    (SELECT COUNT(*) FROM products
                        WHERE verification_status = 'pending') AS pendingVerifications,
                    (SELECT COUNT(*) FROM complaints
                        WHERE status IN ('pending', 'investigating')) AS openComplaints
            `),
            db.promise().query(
                `SELECT id, fullName, email, role, created_at
                 FROM users
                 ORDER BY created_at DESC
                 LIMIT 5`
            ),
            db.promise().query(
                `SELECT p.id, p.name, p.brand, p.category, p.price, p.created_at,
                        p.verification_status, p.is_published, u.fullName AS seller_name
                 FROM products p
                 JOIN users u ON u.id = p.seller_id
                 ORDER BY p.created_at DESC
                 LIMIT 6`
            ),
            db.promise().query(
                `SELECT DATE(order_date) AS date, COUNT(*) AS orders,
                        COALESCE(SUM(total_amount), 0) AS revenue
                 FROM orders
                 WHERE order_status <> 'cancelled'
                   AND order_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                 GROUP BY DATE(order_date)
                 ORDER BY DATE(order_date) ASC`
            ),
        ]);

        res.json({
            success: true,
            stats: statsRows[0],
            recentUsers,
            recentListings,
            dailySales,
        });
    } catch (err) {
        console.error("Error fetching admin dashboard:", err);
        res.status(500).json({ message: "Error fetching dashboard data" });
    }
};

// Get all users
exports.getUsers = (req, res) => {
    const sql = `
        SELECT u.id, u.fullName, u.email, u.phone, u.role, u.created_at,
               (SELECT COUNT(*)
                FROM products p
                WHERE p.retail_partner_id = u.id
                  AND p.verification_status = 'verified') AS verifiedListings
        FROM users u
        ORDER BY u.created_at DESC
    `;
    db.query(sql, (err, users) => {
        if (err) return res.status(500).json({ message: "Error fetching users" });
        res.json({ success: true, users });
    });
};

exports.createUser = async (req, res) => {
    const {
        fullName,
        email,
        phone,
        password,
        role,
        companyName,
        businessRegistrationId,
        companyAddress
    } = req.body;
    const userRole = role;
    const userName = userRole === "retail" ? companyName : fullName;
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedPhone = typeof phone === "string" ? phone.trim() : "";
    const normalizedName = typeof userName === "string" ? userName.trim() : "";

    if (!["customer", "retail", "admin"].includes(userRole)) {
        return res.status(400).json({ message: "Select a valid user role" });
    }
    if (!normalizedName || !normalizedEmail || !normalizedPhone || !password) {
        return res.status(400).json({ message: "Name, email, phone, and password are required" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ message: "Enter a valid email address" });
    }
    if (typeof password !== "string" || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (userRole === "retail" &&
        (typeof businessRegistrationId !== "string" || !businessRegistrationId.trim() ||
            typeof companyAddress !== "string" || !companyAddress.trim())) {
        return res.status(400).json({
            message: "Business registration ID and company address are required for retail partners"
        });
    }

    try {
        const [existingUsers] = await db.promise().query(
            "SELECT id FROM users WHERE email = ?",
            [normalizedEmail]
        );
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: "Email is already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.promise().query(
            `INSERT INTO users
                (fullName, email, phone, password, role, company_name,
                 business_registration_id, company_address)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                normalizedName,
                normalizedEmail,
                normalizedPhone,
                hashedPassword,
                userRole,
                userRole === "retail" ? normalizedName : null,
                userRole === "retail" ? businessRegistrationId.trim() : null,
                userRole === "retail" ? companyAddress.trim() : null
            ]
        );

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                id: result.insertId,
                fullName: normalizedName,
                email: normalizedEmail,
                phone: normalizedPhone,
                role: userRole
            }
        });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "Email is already registered" });
        }
        console.error("Error creating user:", err);
        res.status(500).json({ message: "Failed to create user" });
    }
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
// Assign listing to a retail partner for verification
exports.assignListingToRetail = async (req, res) => {
    const listingId = Number(req.params.id);
    const retailId = Number(req.body.retail_id);

    if (!Number.isInteger(listingId) || listingId <= 0 ||
        !Number.isInteger(retailId) || retailId <= 0) {
        return res.status(400).json({ message: "A valid listing and retail partner are required" });
    }

    try {
        const [retailPartners] = await db.promise().query(
            "SELECT id FROM users WHERE id = ? AND role = 'retail'",
            [retailId]
        );
        if (retailPartners.length === 0) {
            return res.status(400).json({ message: "Invalid retail partner" });
        }

        const [result] = await db.promise().query(
            `UPDATE products
             SET retail_partner_id = ?, verification_status = 'pending'
             WHERE id = ?`,
            [retailId, listingId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Listing not found" });
        }

        res.json({
            success: true,
            message: "Listing assigned to retail partner for verification"
        });
    } catch (err) {
        console.error("Error assigning listing to retail partner:", err);
        res.status(500).json({ message: "Error assigning listing" });
    }
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
        SELECT c.*, u.fullName as user_name, u.email as user_email,
               (SELECT COUNT(*) FROM complaint_attachments ca
                WHERE ca.complaint_id = c.id) AS attachment_count
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
    const complaintId = Number(req.params.id);
    const { status, admin_response } = req.body;

    if (!Number.isInteger(complaintId) || complaintId < 1 ||
        status !== "resolved" || typeof admin_response !== "string" ||
        !admin_response.trim()) {
        return res.status(400).json({ message: "A valid complaint ID and response are required" });
    }

    const sql = `
        UPDATE complaints
        SET status = ?, admin_response = ?, resolved_at = NOW()
        WHERE id = ?
    `;
    db.query(sql, [status, admin_response.trim(), complaintId], (err, result) => {
        if (err) {
            console.error("Error updating complaint:", err);
            return res.status(500).json({ message: "Error updating complaint" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Complaint not found" });
        }
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
exports.updateSettings = async (req, res) => {
    const { settings } = req.body;

    if (!Array.isArray(settings) || settings.length === 0 ||
        settings.some((setting) =>
            !setting || typeof setting.key !== "string" ||
            !["string", "number", "boolean"].includes(typeof setting.value)
        )) {
        return res.status(400).json({ message: "A non-empty list of valid settings is required" });
    }

    const keys = settings.map((setting) => setting.key);
    if (new Set(keys).size !== keys.length) {
        return res.status(400).json({ message: "Duplicate setting keys are not allowed" });
    }

    let connection;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        const [existingRows] = await connection.query(
            "SELECT setting_key FROM system_settings WHERE setting_key IN (?)",
            [keys]
        );
        const existingKeys = new Set(existingRows.map((row) => row.setting_key));
        if (keys.some((key) => !existingKeys.has(key))) {
            await connection.rollback();
            return res.status(400).json({ message: "One or more settings do not exist" });
        }

        for (const setting of settings) {
            await connection.query(
                "UPDATE system_settings SET setting_value = ? WHERE setting_key = ?",
                [String(setting.value), setting.key]
            );
        }

        await connection.commit();
        res.json({ success: true, message: "Settings updated" });
    } catch (err) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Error rolling back settings update:", rollbackError);
            }
        }
        console.error("Error updating settings:", err);
        res.status(500).json({ message: "Error updating settings" });
    } finally {
        if (connection) {
            connection.release();
        }
    }
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