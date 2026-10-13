const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Register Controller
exports.register = async (req, res) => {
    try {
        const {
            fullName,
            companyName,
            businessRegistrationId,
            companyAddress,
            email,
            phone,
            password
        } = req.body;
        const role = req.body.role || "customer";
        const registeredName = role === "retail" ? companyName : fullName;

        // Validation
        if (!registeredName || !email || !phone || !password) {
            return res.status(400).json({ 
                message: "All fields are required" 
            });
        }

        if (role === "retail" && (
            !businessRegistrationId?.trim() || !companyAddress?.trim()
        )) {
            return res.status(400).json({
                message: "Retail company name, business registration ID, and company address are required"
            });
        }

        if (!["customer", "retail"].includes(role)) {
            return res.status(400).json({
                message: "Only customer and retail partner registration is allowed"
            });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                message: "Invalid email format" 
            });
        }

        // Password strength validation
        if (password.length < 6) {
            return res.status(400).json({ 
                message: "Password must be at least 6 characters" 
            });
        }

        // Check if user already exists
        User.findByEmail(email, async (err, existingUser) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ 
                    message: "Database error occurred" 
                });
            }

            if (existingUser && existingUser.length > 0) {
                return res.status(400).json({ 
                    message: "Email already registered" 
                });
            }

            try {
                // Hash password
                const hashPassword = await bcrypt.hash(password, 10);

                // Create user
                User.create(
                    {
                        fullName: registeredName,
                        companyName: role === "retail" ? companyName : null,
                        businessRegistrationId: role === "retail" ? businessRegistrationId : null,
                        companyAddress: role === "retail" ? companyAddress : null,
                        email,
                        phone,
                        password: hashPassword,
                        role
                    },
                    (err, result) => {
                        if (err) {
                            console.error("Registration error:", err);
                            return res.status(500).json({ 
                                message: "Registration failed. Please try again." 
                            });
                        }

                        res.status(201).json({
                            message: "Registration successful",
                            userId: result.insertId
                        });
                    }
                );
            } catch (hashError) {
                console.error("Password hashing error:", hashError);
                return res.status(500).json({ 
                    message: "Error processing registration" 
                });
            }
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ 
            message: "Internal server error" 
        });
    }
};

// Login Controller
exports.login = (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ 
                message: "Email and password are required" 
            });
        }

        User.findByEmail(email, async (err, results) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ 
                    message: "Database error occurred" 
                });
            }

            if (!results || results.length === 0) {
                return res.status(404).json({ 
                    message: "User not found. Please register first." 
                });
            }

            const user = results[0];

            try {
                // Compare passwords
                const match = await bcrypt.compare(password, user.password);

                if (!match) {
                    return res.status(401).json({ 
                        message: "Invalid email or password" 
                    });
                }

                // Generate JWT token
                const token = jwt.sign(
                    {
                        id: user.id,
                        email: user.email,
                        role: user.role
                    },
                    process.env.JWT_SECRET || "fallback_secret",
                    {
                        expiresIn: process.env.JWT_EXPIRES_IN || "1h"
                    }
                );

                res.status(200).json({
                    message: "Login successful",
                    token,
                    user: {
                        id: user.id,
                        fullName: user.fullName,
                        email: user.email,
                        role: user.role
                    }
                });
            } catch (bcryptError) {
                console.error("Password comparison error:", bcryptError);
                return res.status(500).json({ 
                    message: "Error during authentication" 
                });
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ 
            message: "Internal server error" 
        });
    }
};

// Get Current User Controller
exports.getCurrentUser = (req, res) => {
    User.findById(req.user.id, (err, user) => {
        if (err) {
            return res.status(500).json({ 
                message: "Error fetching user data" 
            });
        }
        
        if (!user) {
            return res.status(404).json({ 
                message: "User not found" 
            });
        }

        res.json({ user });
    });
};

// Logout Controller
exports.logout = (req, res) => {
    res.json({ 
        message: "Logged out successfully" 
    });
};