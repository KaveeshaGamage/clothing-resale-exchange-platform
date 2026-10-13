const db = require("../config/db");

const User = {
    // Create new user
    create: (userData, callback) => {
        const sql = `
            INSERT INTO users 
            (fullName, email, phone, password, role, company_name,
             business_registration_id, company_address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.query(
            sql,
            [
                userData.fullName,
                userData.email,
                userData.phone,
                userData.password,
                userData.role || 'customer',
                userData.companyName || null,
                userData.businessRegistrationId || null,
                userData.companyAddress || null
            ],
            (err, result) => {
                if (err) {
                    return callback(err, null);
                }
                callback(null, result);
            }
        );
    },

    // Find user by email
    findByEmail: (email, callback) => {
        const sql = "SELECT * FROM users WHERE email = ?";
        
        db.query(sql, [email], (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, results);
        });
    },

    // Find user by ID
    findById: (id, callback) => {
        const sql = "SELECT id, fullName, email, phone, role, created_at FROM users WHERE id = ?";
        
        db.query(sql, [id], (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, results[0] || null);
        });
    },

    // Update user
    update: (id, userData, callback) => {
        const sql = `
            UPDATE users 
            SET fullName = ?, phone = ?
            WHERE id = ?
        `;
        
        db.query(
            sql,
            [userData.fullName, userData.phone, id],
            (err, result) => {
                if (err) {
                    return callback(err, null);
                }
                callback(null, result);
            }
        );
    },

    // Delete user
    delete: (id, callback) => {
        const sql = "DELETE FROM users WHERE id = ?";
        
        db.query(sql, [id], (err, result) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, result);
        });
    }
};

module.exports = User;