const Order = require("../models/Order");

// Get buyer's orders
exports.getMyOrders = (req, res) => {
    const buyerId = req.user.id;
    
    Order.getOrdersByBuyer(buyerId, (err, orders) => {
        if (err) {
            console.error("Error fetching orders:", err);
            return res.status(500).json({ 
                message: "Error fetching orders",
                error: err 
            });
        }
        
        res.json({
            success: true,
            orders: orders,
            count: orders.length
        });
    });
};

// Get order details
exports.getOrderDetails = (req, res) => {
    const orderId = req.params.id;
    const buyerId = req.user.id;
    
    Order.getOrderById(orderId, buyerId, (err, order) => {
        if (err) {
            return res.status(500).json({ 
                message: "Error fetching order details" 
            });
        }
        
        if (!order || order.length === 0) {
            return res.status(404).json({ 
                message: "Order not found" 
            });
        }
        
        res.json({
            success: true,
            order: order
        });
    });
};

// Create order (buy now)
exports.createOrder = (req, res) => {
    const orderData = {
        buyer_id: req.user.id,
        total_amount: req.body.total_amount,
        shipping_address: req.body.shipping_address,
        items: req.body.items
    };
    
    if (!orderData.items || orderData.items.length === 0) {
        return res.status(400).json({ message: "No items in order" });
    }
    
    Order.create(orderData, (err, result) => {
        if (err) {
            console.error("Error creating order:", err);
            return res.status(500).json({ 
                message: "Error creating order" 
            });
        }
        
        res.status(201).json({
            success: true,
            message: "Order placed successfully",
            orderId: result.orderId
        });
    });
};

// Cancel order
exports.cancelOrder = (req, res) => {
    const orderId = req.params.id;
    const buyerId = req.user.id;
    
    Order.cancelOrder(orderId, buyerId, (err, result) => {
        if (err) {
            return res.status(500).json({ 
                message: "Error cancelling order" 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(400).json({ 
                message: "Order cannot be cancelled" 
            });
        }
        
        res.json({
            success: true,
            message: "Order cancelled successfully"
        });
    });
};

// Get sales history (for seller)
exports.getSalesHistory = (req, res) => {
    const sellerId = req.user.id;
    
    Order.getOrdersBySeller(sellerId, (err, sales) => {
        if (err) {
            return res.status(500).json({ 
                message: "Error fetching sales history" 
            });
        }
        
        res.json({
            success: true,
            sales: sales,
            count: sales.length,
            totalEarnings: sales
                .filter(s => s.order_status !== 'cancelled')
                .reduce((sum, s) => sum + parseFloat(s.price), 0)
        });
    });
};