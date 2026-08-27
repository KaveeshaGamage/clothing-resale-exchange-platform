const db = require("../config/db");

const Order = {
    // Get orders by buyer ID
    getOrdersByBuyer: (buyerId, callback) => {
        const sql = `
            SELECT 
                o.*,
                oi.product_id,
                oi.price,
                oi.quantity,
                p.name as product_name,
                p.image_url as product_image,
                p.brand,
                u.fullName as seller_name
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            JOIN users u ON oi.seller_id = u.id
            WHERE o.buyer_id = ?
            ORDER BY o.order_date DESC
        `;
        
        db.query(sql, [buyerId], (err, results) => {
            if (err) return callback(err, null);
            callback(null, results);
        });
    },

    // Get single order details
    getOrderById: (orderId, buyerId, callback) => {
        const sql = `
            SELECT 
                o.*,
                oi.product_id,
                oi.price,
                oi.quantity,
                p.name as product_name,
                p.image_url as product_image,
                p.brand,
                p.size,
                p.color,
                u.fullName as seller_name,
                u.phone as seller_phone
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            JOIN users u ON oi.seller_id = u.id
            WHERE o.id = ? AND o.buyer_id = ?
        `;
        
        db.query(sql, [orderId, buyerId], (err, results) => {
            if (err) return callback(err, null);
            callback(null, results);
        });
    },

    // Create new order
    create: (orderData, callback) => {
        const { buyer_id, total_amount, shipping_address, items } = orderData;
        
        // Insert order
        const orderSql = `
            INSERT INTO orders (buyer_id, total_amount, shipping_address)
            VALUES (?, ?, ?)
        `;
        
        db.query(orderSql, [buyer_id, total_amount, shipping_address], (err, orderResult) => {
            if (err) return callback(err, null);
            
            const orderId = orderResult.insertId;
            let completedItems = 0;
            const totalItems = items.length;
            
            // Insert order items
            items.forEach(item => {
                const itemSql = `
                    INSERT INTO order_items (order_id, product_id, seller_id, price, quantity)
                    VALUES (?, ?, ?, ?, ?)
                `;
                
                db.query(itemSql, [
                    orderId,
                    item.product_id,
                    item.seller_id,
                    item.price,
                    item.quantity
                ], (err) => {
                    if (err) return callback(err, null);
                    
                    // Update product status to sold
                    const updateSql = "UPDATE products SET status = 'sold' WHERE id = ?";
                    db.query(updateSql, [item.product_id]);
                    
                    completedItems++;
                    if (completedItems === totalItems) {
                        callback(null, { orderId, message: "Order created successfully" });
                    }
                });
            });
        });
    },

    // Cancel order
    cancelOrder: (orderId, buyerId, callback) => {
        const sql = `
            UPDATE orders 
            SET order_status = 'cancelled', payment_status = 'refunded'
            WHERE id = ? AND buyer_id = ? AND order_status = 'pending'
        `;
        
        db.query(sql, [orderId, buyerId], (err, result) => {
            if (err) return callback(err, null);
            
            // Restore products to available
            if (result.affectedRows > 0) {
                const restoreSql = `
                    UPDATE products p
                    JOIN order_items oi ON p.id = oi.product_id
                    SET p.status = 'available'
                    WHERE oi.order_id = ?
                `;
                db.query(restoreSql, [orderId]);
            }
            
            callback(null, result);
        });
    },

    // Get orders by seller (sales history)
    getOrdersBySeller: (sellerId, callback) => {
        const sql = `
            SELECT 
                o.*,
                oi.product_id,
                oi.price,
                oi.quantity,
                p.name as product_name,
                p.image_url as product_image,
                u.fullName as buyer_name
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            JOIN users u ON o.buyer_id = u.id
            WHERE oi.seller_id = ?
            ORDER BY o.order_date DESC
        `;
        
        db.query(sql, [sellerId], (err, results) => {
            if (err) return callback(err, null);
            callback(null, results);
        });
    }
};

module.exports = Order;