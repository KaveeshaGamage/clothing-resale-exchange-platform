import { API_BASE_URL } from "../../api.js";


import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CustomerNavbar from "../../components/CustomerNavbar";
import ProductImage from "../../components/ProductImage";
import "../../styles/OrderDetails.css";

function OrderDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // =====================================================
  // FETCH ORDER DETAILS
  // =====================================================
// =====================================================
// FETCH ORDER DETAILS
// =====================================================
const fetchOrderDetails = async () => {
  setLoading(true);
  setError("");

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please login to view this order.");
      setLoading(false);
      return;
    }

    if (!id) {
      setError("Order ID is missing.");
      setLoading(false);
      return;
    }

    // Get the customer's real orders from the database
    const response = await fetch(
      `${API_BASE_URL}/api/orders/my-orders`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setError(
        data.message || "Failed to fetch order details."
      );
      setLoading(false);
      return;
    }

    // Find the specific order from the real database data
    const orders = data.orders || [];

    const selectedOrder = orders.find(
      (item) => String(item.id) === String(id)
    );

    if (!selectedOrder) {
      setError(`Order #${id} could not be found.`);
      setLoading(false);
      return;
    }

    // Use the actual database order
    setOrder(selectedOrder);

  } catch (err) {
    console.error(
      "Error fetching order details:",
      err
    );

    setError(
      "Network error. Please check your connection."
    );
  } finally {
    setLoading(false);
  }
};
  // =====================================================
  // LOAD ORDER
  // =====================================================
  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

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
      case "picked_up":
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
  // STATUS TEXT
  // =====================================================
  const getStatusText = (status) => {
    if (!status) {
      return "Unknown";
    }

    return status
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const getStatusClass = (status) => {
    if (["picked_up", "in_transit", "out_for_delivery"].includes(status)) {
      return "shipped";
    }
    if (status === "failed") {
      return "cancelled";
    }
    return status;
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================
  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // CANCEL ORDER
  // =====================================================
  const handleCancelOrder = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancelling(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/orders/${id}/cancel`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Order cancelled successfully.");

        // Reload real database data
        fetchOrderDetails();
      } else {
        alert(
          data.message ||
            "Failed to cancel order."
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
    } finally {
      setCancelling(false);
    }
  };

  // =====================================================
  // TRACK ORDER
  // =====================================================
  const handleTrackOrder = () => {
    navigate(
      `/customer/track-order/${order.id}`
    );
  };

  // =====================================================
  // BUY AGAIN
  // =====================================================
  const handleBuyAgain = () => {
    if (!order.product_id) {
      alert(
        "Product information is not available."
      );
      return;
    }

    navigate(
      `/customer/buy/${order.product_id}`
    );
  };

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
            Loading order details...
          </p>
        </div>
      </>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================
  if (error || !order) {
    return (
      <>
        <CustomerNavbar />

        <div className="order-details-page">

          <div className="error-message">
            {error ||
              "Order details could not be found."}
          </div>

          <button
            type="button"
            className="back-details-btn"
            onClick={() =>
              navigate("/customer/orders")
            }
          >
            ← Back to Orders
          </button>

        </div>
      </>
    );
  }

  // =====================================================
  // STATUS STEPS
  // =====================================================
  const statusSteps = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
  ];

  const currentStatusIndex =
    statusSteps.indexOf(
      order.order_status
    );

  // =====================================================
  // PRODUCT TOTAL
  // =====================================================
  const productTotal =
    (parseFloat(order.price) || 0) *
    (parseInt(order.quantity) || 1);

  // =====================================================
  // PAGE
  // =====================================================
  return (
    <>
      <CustomerNavbar />

      <div className="order-details-page">

        {/* =================================================
            HEADER
        ================================================== */}

        <div className="order-details-top">

          <button
            type="button"
            className="back-orders-btn"
            onClick={() =>
              navigate("/customer/orders")
            }
          >
            ← Back to Orders
          </button>

          <div className="order-title-section">

            <h1>
              Order Details
            </h1>

            <p>
              Order #ORD-
              {String(order.id).padStart(
                4,
                "0"
              )}
            </p>

          </div>

        </div>

        {/* =================================================
            ORDER SUMMARY
        ================================================== */}

        <div className="order-summary-header">

          <div>

            <span className="summary-label">
              Order Date
            </span>

            <strong>
              {formatDate(
                order.order_date
              )}
            </strong>

          </div>

          <div>

            <span className="summary-label">
              Order Status
            </span>

            <span
              className={`status-badge ${getStatusClass(
                order.delivery_status || order.order_status
              )}`}
            >
              {getStatusIcon(
                order.delivery_status || order.order_status
              )}{" "}
              {getStatusText(
                order.delivery_status || order.order_status
              )}
            </span>

          </div>

          <div>

            <span className="summary-label">
              Payment
            </span>

            <strong>
              {order.payment_method ===
              "cash_on_delivery"
                ? "Cash on Delivery"
                : order.payment_method ||
                  "Not specified"}
            </strong>

          </div>

        </div>

        {/* =================================================
            ORDER STATUS
        ================================================== */}

        <section className="details-card">

          <div className="section-heading">

            <h2>
              Order Status
            </h2>

            <span>
              {getStatusText(
                order.order_status
              )}
            </span>

          </div>

          {order.order_status ===
          "cancelled" ? (

            <div className="cancelled-status">

              <div className="cancelled-icon">
                ❌
              </div>

              <div>

                <h3>
                  Order Cancelled
                </h3>

                <p>
                  This order has been
                  cancelled.
                </p>

              </div>

            </div>

          ) : (

            <div className="status-timeline">

              {statusSteps.map(
                (status, index) => {

                  const completed =
                    index <=
                    currentStatusIndex;

                  const active =
                    index ===
                    currentStatusIndex;

                  return (
                    <div
                      className={`timeline-step ${
                        completed
                          ? "completed"
                          : ""
                      } ${
                        active
                          ? "active"
                          : ""
                      }`}
                      key={status}
                    >

                      <div className="timeline-icon">

                        {completed
                          ? getStatusIcon(
                              status
                            )
                          : index + 1}

                      </div>

                      <div className="timeline-label">

                        {getStatusText(
                          status
                        )}

                      </div>

                      {index <
                        statusSteps.length -
                          1 && (

                        <div
                          className={`timeline-line ${
                            index <
                            currentStatusIndex
                              ? "completed"
                              : ""
                          }`}
                        />

                      )}

                    </div>
                  );
                }
              )}

            </div>

          )}

        </section>

        {/* =================================================
            PRODUCT
        ================================================== */}

        <section className="details-card">

          <div className="section-heading">

            <h2>
              Product
            </h2>

          </div>

          <div className="product-details">

            <ProductImage
              src={order.product_image}
              alt={
                order.product_name ||
                "Product"
              }
              className="order-product-image"
            />

            <div className="order-product-info">

              <h3>
                {order.product_name ||
                  "Product"}
              </h3>

              <p className="seller-name">
                Seller:{" "}
                {order.seller_name ||
                  "Unknown"}
              </p>

              <div className="product-meta">

                <span>
                  Quantity:{" "}
                  {order.quantity || 1}
                </span>

                <span>
                  Unit Price: Rs.{" "}
                  {(
                    parseFloat(
                      order.price
                    ) || 0
                  ).toLocaleString()}
                </span>

              </div>

            </div>

            <div className="product-total">

              <span>
                Total
              </span>

              <strong>
                Rs.{" "}
                {productTotal.toLocaleString()}
              </strong>

            </div>

          </div>

        </section>

        {/* =================================================
            DELIVERY + PAYMENT
        ================================================== */}

        <div className="details-grid">

          {/* DELIVERY */}
          <section className="details-card">

            <div className="section-heading">

              <h2>
                Delivery Information
              </h2>

            </div>

            <div className="information-content">

              <div className="information-row">

                <span className="info-icon">
                  📍
                </span>

                <div>

                  <span className="info-label">
                    Shipping Address
                  </span>

                  <p>
                    {order.shipping_address ||
                      "Address not available"}
                  </p>

                </div>

              </div>

              {order.tracking_number && (

                <div className="information-row">

                  <span className="info-icon">
                    🚚
                  </span>

                  <div>

                    <span className="info-label">
                      Tracking Number
                    </span>

                    <p className="tracking-number">
                      {order.tracking_number}
                    </p>

                  </div>

                </div>

              )}

              {order.delivery_date && (

                <div className="information-row">

                  <span className="info-icon">
                    📦
                  </span>

                  <div>

                    <span className="info-label">
                      Delivery Date
                    </span>

                    <p>
                      {formatDate(
                        order.delivery_date
                      )}
                    </p>

                  </div>

                </div>

              )}

            </div>

          </section>

          {/* PAYMENT */}
          <section className="details-card">

            <div className="section-heading">

              <h2>
                Payment Summary
              </h2>

            </div>

            <div className="payment-summary">

              <div className="payment-row">

                <span>
                  Product Price
                </span>

                <span>
                  Rs.{" "}
                  {productTotal.toLocaleString()}
                </span>

              </div>

              <div className="payment-row">

                <span>
                  Shipping
                </span>

                <span>
                  Free
                </span>

              </div>

              <div className="payment-divider" />

              <div className="payment-row total">

                <strong>
                  Total Amount
                </strong>

                <strong>
                  Rs.{" "}
                  {(
                    parseFloat(
                      order.total_amount
                    ) || 0
                  ).toLocaleString()}
                </strong>

              </div>

              <div className="payment-method">

                <span>
                  Payment Method
                </span>

                <strong>
                  {order.payment_method ===
                  "cash_on_delivery"
                    ? "Cash on Delivery"
                    : order.payment_method ||
                      "Not specified"}
                </strong>

              </div>

              <div
                className={`payment-status ${
                  order.payment_status ||
                  "pending"
                }`}
              >

                Payment:{" "}

                {order.payment_status ===
                "pending"
                  ? "Pending"
                  : order.payment_status ===
                    "paid"
                  ? "Paid"
                  : getStatusText(
                      order.payment_status
                    )}

              </div>

            </div>

          </section>

        </div>

        {/* =================================================
            ACTIONS
        ================================================== */}

        <div className="order-actions-details">

          {/* CANCEL */}
          {order.order_status ===
            "pending" && (

            <button
              type="button"
              className="cancel-order-btn"
              onClick={handleCancelOrder}
              disabled={cancelling}
            >
              {cancelling
                ? "Cancelling..."
                : "Cancel Order"}
            </button>

          )}

          {/* TRACK */}
          {(order.order_status ===
            "confirmed" ||
            order.order_status ===
              "shipped") && (

            <button
              type="button"
              className="track-order-btn"
              onClick={handleTrackOrder}
            >
              🚚 Track Order
            </button>

          )}

          {/* BUY AGAIN */}
          {order.order_status ===
            "delivered" && (

            <button
              type="button"
              className="buy-again-details-btn"
              onClick={handleBuyAgain}
            >
              🛍 Buy Again
            </button>

          )}

          {/* BACK */}
          <button
            type="button"
            className="back-details-btn"
            onClick={() =>
              navigate("/customer/orders")
            }
          >
            Back to Orders
          </button>

        </div>

      </div>
    </>
  );
}

export default OrderDetails;
