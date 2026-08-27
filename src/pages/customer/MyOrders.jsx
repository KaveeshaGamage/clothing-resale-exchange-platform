import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CustomerNavbar from "../../components/CustomerNavbar";
import "../../styles/MyOrders.css";

function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/orders/my-orders", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredOrders = () => {
    if (activeFilter === "all") return orders;
    return orders.filter(order => order.order_status === activeFilter);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "status-pending";
      case "confirmed": return "status-confirmed";
      case "shipped": return "status-shipped";
      case "delivered": return "status-delivered";
      case "cancelled": return "status-cancelled";
      default: return "";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending": return "⏳";
      case "confirmed": return "✅";
      case "shipped": return "🚚";
      case "delivered": return "📦";
      case "cancelled": return "❌";
      default: return "📋";
    }
  };

  const handleTrackOrder = (orderId) => {
    navigate(`/customer/dashboard/track-order/${orderId}`);
  };

  const handleViewDetails = (orderId) => {
    navigate(`/customer/dashboard/order-details/${orderId}`);
  };

  const handleBuyAgain = (productId) => {
    navigate(`/customer/dashboard/buy/${productId}`);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert("Order cancelled successfully");
        fetchMyOrders(); // Refresh orders
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
    }
  };

  const filteredOrders = getFilteredOrders();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  return (
    <>
      <CustomerNavbar />
    <div className="my-orders-page">
      <div className="orders-header">
        <h1>My Orders</h1>
        <p>Track and manage your purchases</p>
      </div>

      {/* Order Statistics */}
      <div className="order-stats">
        <div className="stat-card">
          <span className="stat-icon">📋</span>
          <div className="stat-info">
            <h3>{orders.length}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🚚</span>
          <div className="stat-info">
            <h3>{orders.filter(o => o.order_status === 'shipped').length}</h3>
            <p>In Transit</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📦</span>
          <div className="stat-info">
            <h3>{orders.filter(o => o.order_status === 'delivered').length}</h3>
            <p>Delivered</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">💰</span>
          <div className="stat-info">
            <h3>Rs. {orders
              .filter(o => o.order_status !== 'cancelled')
              .reduce((sum, o) => sum + parseFloat(o.total_amount), 0)
              .toLocaleString()}
            </h3>
            <p>Total Spent</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={`tab ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All Orders
        </button>
        <button 
          className={`tab ${activeFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveFilter('pending')}
        >
          Pending
        </button>
        <button 
          className={`tab ${activeFilter === 'confirmed' ? 'active' : ''}`}
          onClick={() => setActiveFilter('confirmed')}
        >
          Confirmed
        </button>
        <button 
          className={`tab ${activeFilter === 'shipped' ? 'active' : ''}`}
          onClick={() => setActiveFilter('shipped')}
        >
          Shipped
        </button>
        <button 
          className={`tab ${activeFilter === 'delivered' ? 'active' : ''}`}
          onClick={() => setActiveFilter('delivered')}
        >
          Delivered
        </button>
        <button 
          className={`tab ${activeFilter === 'cancelled' ? 'active' : ''}`}
          onClick={() => setActiveFilter('cancelled')}
        >
          Cancelled
        </button>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="no-orders">
          <span className="empty-icon">🛒</span>
          <h3>No orders found</h3>
          <p>You haven't placed any orders yet.</p>
          <button onClick={() => navigate("/customer/dashboard/shop")}>
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-id">
                  <span className="order-label">Order ID:</span>
                  <span className="order-number">#ORD-{order.id.toString().padStart(4, '0')}</span>
                </div>
                <div className={`order-status ${getStatusColor(order.order_status)}`}>
                  <span>{getStatusIcon(order.order_status)}</span>
                  <span>{order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}</span>
                </div>
              </div>

              <div className="order-content">
                <div className="order-product">
                  <img 
                    src={order.product_image || "https://via.placeholder.com/80x80?text=Product"} 
                    alt={order.product_name}
                    className="product-image"
                  />
                  <div className="product-details">
                    <h4>{order.product_name}</h4>
                    <p className="seller">Seller: {order.seller_name}</p>
                    <p className="quantity">Qty: {order.quantity}</p>
                  </div>
                </div>

                <div className="order-info">
                  <div className="info-item">
                    <span className="info-label">Order Date:</span>
                    <span>{new Date(order.order_date).toLocaleDateString()}</span>
                  </div>
                  {order.delivery_date && (
                    <div className="info-item">
                      <span className="info-label">Delivered:</span>
                      <span>{new Date(order.delivery_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {order.tracking_number && (
                    <div className="info-item">
                      <span className="info-label">Tracking:</span>
                      <span className="tracking-number">{order.tracking_number}</span>
                    </div>
                  )}
                </div>

                <div className="order-price">
                  <div className="price-detail">
                    <span>Unit Price:</span>
                    <span>Rs. {parseFloat(order.price).toLocaleString()}</span>
                  </div>
                  <div className="total-price">
                    <span>Total:</span>
                    <span>Rs. {parseFloat(order.total_amount).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="order-actions">
                {order.order_status === 'delivered' && (
                  <button 
                    className="action-btn buy-again-btn"
                    onClick={() => handleBuyAgain(order.id)}
                  >
                    Buy Again
                  </button>
                )}
                
                {(order.order_status === 'shipped' || order.order_status === 'confirmed') && (
                  <button 
                    className="action-btn track-btn"
                    onClick={() => handleTrackOrder(order.id)}
                  >
                    Track Order
                  </button>
                )}
                
                {order.order_status === 'pending' && (
                  <button 
                    className="action-btn cancel-btn"
                    onClick={() => handleCancelOrder(order.id)}
                  >
                    Cancel Order
                  </button>
                )}
                
                <button 
                  className="action-btn details-btn"
                  onClick={() => handleViewDetails(order.id)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}

export default MyOrders;