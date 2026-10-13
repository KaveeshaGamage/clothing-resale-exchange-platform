const db = require("../config/db");

const Order = {
    // Get orders by buyer ID
    getOrdersByBuyer: (buyerId, callback) => {
        const sql = `
            SELECT 
                o.id,
                o.buyer_id,
                o.total_amount,
                CASE
                    WHEN o.order_status = 'cancelled' THEN 'cancelled'
                    WHEN ds.delivery_count > 0
                         AND ds.delivered_count = ds.delivery_count THEN 'delivered'
                    WHEN ds.active_count > 0 OR ds.delivered_count > 0 THEN 'shipped'
                    WHEN ds.failed_count > 0 THEN 'confirmed'
                    ELSE o.order_status
                END AS order_status,
                (
                    SELECT d.delivery_status
                    FROM deliveries d
                    WHERE d.order_id = o.id
                    ORDER BY d.updated_at DESC, d.id DESC
                    LIMIT 1
                ) AS delivery_status,
                o.payment_status,
                o.payment_method,
                o.shipping_address,
                o.order_date,
                o.delivery_date,
                oi.product_id,
                oi.price,
                oi.quantity,
                p.name as product_name,
                p.image_url as product_image,
                p.brand,
                u.fullName as seller_name
            FROM orders o
            LEFT JOIN (
                SELECT order_id,
                       COUNT(*) AS delivery_count,
                       SUM(delivery_status = 'delivered') AS delivered_count,
                       SUM(delivery_status IN
                           ('picked_up', 'in_transit', 'out_for_delivery')) AS active_count,
                       SUM(delivery_status = 'failed') AS failed_count
                FROM deliveries
                GROUP BY order_id
            ) ds ON ds.order_id = o.id
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
                o.id,
                o.buyer_id,
                o.total_amount,
                CASE
                    WHEN o.order_status = 'cancelled' THEN 'cancelled'
                    WHEN ds.delivery_count > 0
                         AND ds.delivered_count = ds.delivery_count THEN 'delivered'
                    WHEN ds.active_count > 0 OR ds.delivered_count > 0 THEN 'shipped'
                    WHEN ds.failed_count > 0 THEN 'confirmed'
                    ELSE o.order_status
                END AS order_status,
                (
                    SELECT d.delivery_status
                    FROM deliveries d
                    WHERE d.order_id = o.id
                    ORDER BY d.updated_at DESC, d.id DESC
                    LIMIT 1
                ) AS delivery_status,
                o.payment_status,
                o.payment_method,
                o.shipping_address,
                o.order_date,
                o.delivery_date,
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
            LEFT JOIN (
                SELECT order_id,
                       COUNT(*) AS delivery_count,
                       SUM(delivery_status = 'delivered') AS delivered_count,
                       SUM(delivery_status IN
                           ('picked_up', 'in_transit', 'out_for_delivery')) AS active_count,
                       SUM(delivery_status = 'failed') AS failed_count
                FROM deliveries
                GROUP BY order_id
            ) ds ON ds.order_id = o.id
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
    create: async (orderData, callback) => {
        const { buyer_id, shipping_address, items } = orderData;
        let connection;

        try {
            if (!Array.isArray(items) || items.length === 0 ||
                items.some((item) => !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1)) {
                return callback(new Error("Order items must have a valid quantity"), null);
            }

            connection = await db.promise().getConnection();
            await connection.beginTransaction();

            const productIds = items.map((item) => Number(item.product_id));
            const [products] = await connection.query(
                `SELECT id, seller_id, price, quantity, status,
                        verification_status, is_published
                 FROM products
                 WHERE id IN (?)
                 ORDER BY id
                 FOR UPDATE`,
                [productIds]
            );
            const productsById = new Map(products.map((product) => [Number(product.id), product]));
            let totalAmount = 0;

            for (const item of items) {
                const product = productsById.get(Number(item.product_id));
                if (!product || product.status !== "available" ||
                    product.verification_status !== "verified" ||
                    !product.is_published ||
                    Number(item.quantity) > product.quantity) {
                    throw new Error(`Product #${item.product_id} is unavailable or has insufficient stock`);
                }
                if (String(product.seller_id) === String(buyer_id)) {
                    throw new Error(`You cannot buy your own product #${item.product_id}`);
                }
                totalAmount += Number(product.price) * Number(item.quantity);
            }

            const [orderResult] = await connection.query(
                `INSERT INTO orders (buyer_id, total_amount, shipping_address)
                 VALUES (?, ?, ?)`,
                [buyer_id, totalAmount, shipping_address]
            );
            const orderId = orderResult.insertId;

            for (const item of items) {
                const product = productsById.get(Number(item.product_id));
                await connection.query(
                    `INSERT INTO order_items (order_id, product_id, seller_id, price, quantity)
                     VALUES (?, ?, ?, ?, ?)`,
                    [orderId, product.id, product.seller_id, product.price, Number(item.quantity)]
                );

                const [stockUpdate] = await connection.query(
                    `UPDATE products
                     SET quantity = quantity - ?,
                         status = IF(quantity - ? = 0, 'sold', 'available')
                     WHERE id = ? AND status = 'available' AND quantity >= ?`,
                    [Number(item.quantity), Number(item.quantity), product.id, Number(item.quantity)]
                );
                if (stockUpdate.affectedRows !== 1) {
                    throw new Error(`Insufficient stock for product #${item.product_id}`);
                }
            }

            await connection.commit();
            callback(null, { orderId, message: "Order created successfully" });
        } catch (err) {
            if (connection) await connection.rollback();
            callback(err, null);
        } finally {
            if (connection) connection.release();
        }
    },

    // Cancel order
    cancelOrder: (orderId, buyerId, callback) => {
        const cancel = async () => {
            const connection = await db.promise().getConnection();
            try {
                await connection.beginTransaction();
                const [result] = await connection.query(
                    `UPDATE orders
                     SET order_status = 'cancelled', payment_status = 'refunded'
                     WHERE id = ? AND buyer_id = ? AND order_status = 'pending'`,
                    [orderId, buyerId]
                );

                if (result.affectedRows > 0) {
                    await connection.query(
                        `UPDATE deliveries
                         SET delivery_status = 'cancelled'
                         WHERE order_id = ?`,
                        [orderId]
                    );

                    await connection.query(
                        `UPDATE products p
                         JOIN (
                             SELECT product_id, SUM(quantity) AS quantity
                             FROM order_items
                             WHERE order_id = ?
                             GROUP BY product_id
                         ) oi ON p.id = oi.product_id
                         SET p.quantity = p.quantity + oi.quantity,
                             p.status = IF(p.status = 'sold', 'available', p.status)`,
                        [orderId]
                    );
                }

                await connection.commit();
                return result;
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        };

        cancel().then(
            (result) => callback(null, result),
            (err) => callback(err, null)
        );
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