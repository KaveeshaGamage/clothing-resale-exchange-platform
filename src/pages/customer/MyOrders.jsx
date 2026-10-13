import { API_BASE_URL } from "../../api.js";

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CustomerNavbar from "../../components/CustomerNavbar.jsx";
import ProductImage from "../../components/ProductImage.jsx";
import "../../styles/MyOrders.css";

function MyOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // =====================================================
  // FETCH MY ORDERS
  // =====================================================
  const fetchMyOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login to view your orders.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/orders/my-orders`,
        {
          method: "GET",
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setOrders(data.orders || []);
      } else {
        setError(data.message || "Failed to fetch orders");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);

      setError(
        "Network error. Please check your connection."
      );
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // =====================================================
  // LOAD ORDERS WHEN PAGE OPENS
  // =====================================================
  useEffect(() => {
    fetchMyOrders();
    const refreshTimer = window.setInterval(() => {
      fetchMyOrders(true);
    }, 20000);

    return () => window.clearInterval(refreshTimer);
  }, [fetchMyOrders]);

  // =====================================================
  // FILTER ORDERS
  // =====================================================
  const getFilteredOrders = () => {
    if (activeFilter === "all") {
      return orders;
    }

    return orders.filter(
      (order) => order.order_status === activeFilter
    );
  };

  // =====================================================
  // STATUS COLOR
  // =====================================================
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "status-pending";

      case "confirmed":
        return "status-confirmed";

      case "shipped":
      case "picked_up":
      case "in_transit":
      case "out_for_delivery":
        return "status-shipped";

      case "delivered":
        return "status-delivered";

      case "failed":
      case "cancelled":
        return "status-cancelled";

      default:
        return "";
    }
  };

  // =====================================================
  // STATUS ICON
  // =====================================================
  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return "⏳";

      case "confirmed":
        return "✅";

      case "shipped":
        return "🚚";

      case "picked_up":
        return "📦";

      case "in_transit":
      case "out_for_delivery":
        return "🚚";

      case "delivered":
        return "📦";

      case "failed":
      case "cancelled":
        return "❌";

      default:
        return "📋";
    }
  };

  // =====================================================
  // TRACK ORDER
  // =====================================================
  const handleTrackOrder = (orderId) => {
    navigate(`/customer/track-order/${orderId}`);
  };

  // =====================================================
  // VIEW ORDER DETAILS
  // URL:
  // /customer/order-details/:id
  // =====================================================
  const handleViewDetails = (orderId) => {
    navigate(`/customer/order-details/${orderId}`);
  };

  // =====================================================
  // BUY AGAIN
  // =====================================================
  const handleBuyAgain = (productId) => {
    if (!productId) {
      alert("Product information is not available.");
      return;
    }

    navigate(`/customer/buy/${productId}`);
  };

  // =====================================================
  // CANCEL ORDER
  // =====================================================
  const handleCancelOrder = async (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login again.");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/orders/${orderId}/cancel`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Order cancelled successfully");

        // Refresh orders
        fetchMyOrders();
      } else {
        alert(
          data.message || "Failed to cancel order"
        );
      }
    } catch (err) {
      console.error(
        "Error cancelling order:",
        err
      );

      alert(
        "Network error while cancelling order."
      );
    }
  };

  // =====================================================
  // FILTERED ORDERS
  // =====================================================
  const filteredOrders = getFilteredOrders();

  const inTransitOrderCount = new Set(
    orders
      .filter((order) =>
        ["picked_up", "in_transit", "out_for_delivery"].includes(order.delivery_status) ||
        (!order.delivery_status && order.order_status === "shipped")
      )
      .map((order) => order.id)
  ).size;

  // =====================================================
  // LOADING
  // =====================================================
  if (loading) {
    return (
      <>
        <CustomerNavbar />

        <div className="loading">
          <div className="spinner"></div>

          <p>
            Loading your orders...
          </p>
        </div>
      </>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================
  return (
    <>
      <CustomerNavbar />

      <div className="my-orders-page">

        {/* =================================================
            HEADER
        ================================================== */}

        <div className="orders-header">
          <div>
            <h1>
              My Orders
            </h1>

            <p>
              Track and manage your purchases
            </p>
          </div>
          <button
            type="button"
            className="orders-refresh-btn"
            onClick={() => fetchMyOrders()}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh status"}
          </button>

        </div>

        {/* =================================================
            ORDER STATISTICS
        ================================================== */}

        <div className="order-stats">

          {/* TOTAL ORDERS */}
          <div className="stat-card">

            <span className="stat-icon">
              📋
            </span>

            <div className="stat-info">

              <h3>
                {orders.length}
              </h3>

              <p>
                Total Orders
              </p>

            </div>

          </div>

          {/* IN TRANSIT */}
          <div className="stat-card">

            <span className="stat-icon">
              🚚
            </span>

            <div className="stat-info">

              <h3>
                {inTransitOrderCount}
              </h3>

              <p>
                In Transit
              </p>

            </div>

          </div>

          {/* DELIVERED */}
          <div className="stat-card">

            <span className="stat-icon">
              📦
            </span>

            <div className="stat-info">

              <h3>
                {
                  orders.filter(
                    (order) =>
                      order.order_status ===
                      "delivered"
                  ).length
                }
              </h3>

              <p>
                Delivered
              </p>

            </div>

          </div>

          {/* TOTAL SPENT */}
          <div className="stat-card">

            <span className="stat-icon">
              💰
            </span>

            <div className="stat-info">

              <h3>
                Rs.{" "}
                {orders
                  .filter(
                    (order) =>
                      order.order_status !==
                      "cancelled"
                  )
                  .reduce(
                    (sum, order) =>
                      sum +
                      (parseFloat(
                        order.total_amount
                      ) || 0),
                    0
                  )
                  .toLocaleString()}
              </h3>

              <p>
                Total Spent
              </p>

            </div>

          </div>

        </div>

        {/* =================================================
            FILTER TABS
        ================================================== */}

        <div className="filter-tabs">

          <button
            type="button"
            className={`tab ${
              activeFilter === "all"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveFilter("all")
            }
          >
            All Orders
          </button>

          <button
            type="button"
            className={`tab ${
              activeFilter === "pending"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveFilter("pending")
            }
          >
            Pending
          </button>

          <button
            type="button"
            className={`tab ${
              activeFilter === "confirmed"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveFilter("confirmed")
            }
          >
            Confirmed
          </button>

          <button
            type="button"
            className={`tab ${
              activeFilter === "shipped"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveFilter("shipped")
            }
          >
            Shipped
          </button>

          <button
            type="button"
            className={`tab ${
              activeFilter === "delivered"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveFilter("delivered")
            }
          >
            Delivered
          </button>

          <button
            type="button"
            className={`tab ${
              activeFilter === "cancelled"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActiveFilter("cancelled")
            }
          >
            Cancelled
          </button>

        </div>

        {/* =================================================
            ERROR MESSAGE
        ================================================== */}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* =================================================
            NO ORDERS
        ================================================== */}

        {filteredOrders.length === 0 ? (

          <div className="no-orders">

            <span className="empty-icon">
              🛒
            </span>

            <h3>
              No orders found
            </h3>

            <p>
              You haven't placed any orders yet.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/customer/shop")
              }
            >
              Start Shopping
            </button>

          </div>

        ) : (

          /* =================================================
             ORDERS LIST
          ================================================= */

          <div className="orders-list">

            {filteredOrders.map((order) => (

              <div
                key={order.id}
                className="order-card"
              >

                {/* =================================================
                    ORDER HEADER
                ================================================== */}

                <div className="order-header">

                  <div className="order-id">

                    <span className="order-label">
                      Order ID:
                    </span>

                    <span className="order-number">
                      #ORD-
                      {order.id
                        .toString()
                        .padStart(4, "0")}
                    </span>

                  </div>

                  <div
                    className={`order-status ${getStatusColor(
                      order.delivery_status || order.order_status
                    )}`}
                  >

                    <span>
                      {getStatusIcon(
                        order.delivery_status || order.order_status
                      )}
                    </span>

                    <span>
                      {(order.delivery_status || order.order_status)
                        ? (order.delivery_status || order.order_status)
                            .split("_")
                            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                            .join(" ")
                        : "Unknown"}
                    </span>

                  </div>

                </div>

                {/* =================================================
                    ORDER CONTENT
                ================================================== */}

                <div className="order-content">

                  {/* PRODUCT */}
                  <div className="order-product">

                    <ProductImage
                      src={order.product_image}
                      alt={
                        order.product_name ||
                        "Product"
                      }
                      className="product-image"
                    />

                    <div className="product-details">

                      <h4>
                        {order.product_name ||
                          "Product"}
                      </h4>

                      <p className="seller">
                        Seller:{" "}
                        {order.seller_name ||
                          "Unknown"}
                      </p>

                      <p className="quantity">
                        Qty:{" "}
                        {order.quantity || 1}
                      </p>

                    </div>

                  </div>

                  {/* ORDER INFORMATION */}
                  <div className="order-info">

                    <div className="info-item">

                      <span className="info-label">
                        Order Date:
                      </span>

                      <span>
                        {order.order_date
                          ? new Date(
                              order.order_date
                            ).toLocaleDateString()
                          : "-"}
                      </span>

                    </div>

                    {order.delivery_date && (

                      <div className="info-item">

                        <span className="info-label">
                          Delivered:
                        </span>

                        <span>
                          {new Date(
                            order.delivery_date
                          ).toLocaleDateString()}
                        </span>

                      </div>

                    )}

                    {order.tracking_number && (

                      <div className="info-item">

                        <span className="info-label">
                          Tracking:
                        </span>

                        <span className="tracking-number">
                          {order.tracking_number}
                        </span>

                      </div>

                    )}

                  </div>

                  {/* PRICE */}
                  <div className="order-price">

                    <div className="price-detail">

                      <span>
                        Unit Price:
                      </span>

                      <span>
                        Rs.{" "}
                        {(
                          parseFloat(
                            order.price
                          ) || 0
                        ).toLocaleString()}
                      </span>

                    </div>

                    <div className="total-price">

                      <span>
                        Total:
                      </span>

                      <span>
                        Rs.{" "}
                        {(
                          parseFloat(
                            order.total_amount
                          ) || 0
                        ).toLocaleString()}
                      </span>

                    </div>

                  </div>

                </div>

                {/* =================================================
                    ORDER ACTIONS
                ================================================== */}

                <div className="order-actions">

                  {/* BUY AGAIN */}
                  {order.order_status ===
                    "delivered" && (

                    <button
                      type="button"
                      className="action-btn buy-again-btn"
                      onClick={() =>
                        handleBuyAgain(
                          order.product_id
                        )
                      }
                    >
                      Buy Again
                    </button>

                  )}

                  {/* TRACK ORDER */}
                  {(order.order_status ===
                    "shipped" ||
                    order.order_status ===
                      "confirmed") && (

                    <button
                      type="button"
                      className="action-btn track-btn"
                      onClick={() =>
                        handleTrackOrder(
                          order.id
                        )
                      }
                    >
                      Track Order
                    </button>

                  )}

                  {/* CANCEL */}
                  {order.order_status ===
                    "pending" && (

                    <button
                      type="button"
                      className="action-btn cancel-btn"
                      onClick={() =>
                        handleCancelOrder(
                          order.id
                        )
                      }
                    >
                      Cancel Order
                    </button>

                  )}

                  {/* DETAILS */}
                  <button
                    type="button"
                    className="action-btn details-btn"
                    onClick={() =>
                      handleViewDetails(
                        order.id
                      )
                    }
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
