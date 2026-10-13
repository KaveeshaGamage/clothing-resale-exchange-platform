import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../api.js";
import "../../styles/DeliveryManagement.css";
import RetailNavbar from "../../components/RetailNavbar.jsx";

function DeliveryManagement() {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/api/retail/deliveries`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
          throw new Error("Could not load deliveries.");
        }

        const data = await response.json();
        setDeliveries(data.deliveries || []);
      } catch (err) {
        console.error("Error loading deliveries:", err);
        setError(err.message || "Could not load deliveries.");
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveries();
  }, []);

  const statusBadges = {
    pending: { text: "Pending", class: "badge-pending" },
    picked_up: { text: "Picked Up", class: "badge-picked" },
    in_transit: { text: "In Transit", class: "badge-transit" },
    out_for_delivery: { text: "Out for Delivery", class: "badge-out" },
    delivered: { text: "Delivered", class: "badge-delivered" },
    failed: { text: "Failed", class: "badge-failed" },
    cancelled: { text: "Cancelled", class: "badge-cancelled" }
  };

  const filteredDeliveries = filter === "all"
    ? deliveries
    : deliveries.filter((delivery) => {
        const status = delivery.order_status === "cancelled"
          ? "cancelled"
          : delivery.delivery_status;
        return status === filter;
      });

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <>
      <RetailNavbar />
      <div className="delivery-management">
        <div className="page-header">
          <h1>Delivery Management</h1>
          <p>Track and manage all deliveries</p>
        </div>

        <div className="filter-tabs">
          {[
            ["all", "All"],
            ["pending", "Pending"],
            ["picked_up", "Picked Up"],
            ["in_transit", "In Transit"],
            ["out_for_delivery", "Out for Delivery"],
            ["delivered", "Delivered"],
            ["cancelled", "Cancelled"]
          ].map(([value, label]) => (
            <button
              key={value}
              className={`tab ${filter === value ? "active" : ""}`}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {error && <p role="alert">{error}</p>}
        <div className="deliveries-table">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Product</th>
                <th>Buyer</th>
                <th>Address</th>
                <th>Status</th>
                <th>Tracking #</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan="8">{error ? "Unable to display deliveries." : "No deliveries found."}</td>
                </tr>
              ) : filteredDeliveries.map((delivery) => {
                const currentStatus = delivery.order_status === "cancelled"
                  ? "cancelled"
                  : delivery.delivery_status;
                const badge = statusBadges[currentStatus] || statusBadges.pending;
                return (
                  <tr key={delivery.id}>
                    <td>#{delivery.order_id}</td>
                    <td>{delivery.product_name}</td>
                    <td>{delivery.buyer_name}</td>
                    <td className="address-cell">{delivery.delivery_address}</td>
                    <td>
                      <span className={`status-badge ${badge.class}`}>{badge.text}</span>
                    </td>
                    <td>{delivery.tracking_number || "-"}</td>
                    <td>{new Date(delivery.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="update-btn"
                        onClick={() => navigate(`/retail/update-delivery/${delivery.id}`)}
                        disabled={currentStatus === "cancelled"}
                      >
                        {currentStatus === "cancelled" ? "Cancelled" : "Update"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default DeliveryManagement;
