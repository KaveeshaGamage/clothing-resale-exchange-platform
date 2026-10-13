ALTER TABLE deliveries
  MODIFY COLUMN delivery_status
    ENUM('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'cancelled')
    DEFAULT 'pending';

UPDATE deliveries d
JOIN orders o ON o.id = d.order_id
SET d.delivery_status = 'cancelled'
WHERE o.order_status = 'cancelled';
