const jwt = require("jsonwebtoken");

const authMiddleware = {
    // Verify JWT Token
    verifyToken: (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ 
                    message: "Access denied. No token provided." 
                });
            }

            const token = authHeader.split(' ')[1];

            if (!token) {
                return res.status(401).json({ 
                    message: "Access denied. No token provided." 
                });
            }

            const decoded = jwt.verify(
                token, 
                process.env.JWT_SECRET || "fallback_secret"
            );
            
            req.user = decoded;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    message: "Token expired. Please login again." 
                });
            }
            
            return res.status(401).json({ 
                message: "Invalid token" 
            });
        }
    },

    // Check User Role
    checkRole: (...roles) => {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ 
                    message: "Authentication required" 
                });
            }

            if (!roles.includes(req.user.role)) {
                return res.status(403).json({ 
                    message: "Access denied. Insufficient permissions." 
                });
            }
            
            next();
        };
    }
};

module.exports = authMiddleware;