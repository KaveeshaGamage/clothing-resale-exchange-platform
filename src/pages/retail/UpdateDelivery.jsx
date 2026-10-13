import { API_BASE_URL } from "../../api.js";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../styles/UpdateDelivery.css";
import RetailNavbar from "../../components/RetailNavbar.jsx";
function UpdateDelivery() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    delivery_status: "",
    tracking_number: "",
    courier_name: "",
    estimated_delivery_date: "",
    delivery_notes: "",
    pickup_address: "",
    delivery_address: ""
  });

  const statusOptions = [
    { value: "pending", label: "Pending", icon: "⏳", color: "#f57f17" },
    { value: "picked_up", label: "Picked Up", icon: "📦", color: "#1565c0" },
    { value: "in_transit", label: "In Transit", icon: "🚚", color: "#e65100" },
    { value: "out_for_delivery", label: "Out for Delivery", icon: "🏃", color: "#00695c" },
    { value: "delivered", label: "Delivered", icon: "✅", color: "#1b5e20" },
    { value: "failed", label: "Failed", icon: "❌", color: "#b71c1c" }
  ];

  const courierOptions = [
    "NOLIMIT Express",
    "Domex",
    "PromptX",
    "Aramex",
    "DHL",
    "FedEx",
    "Other"
  ];

  useEffect(() => {
    if (!id || !/^\d+$/.test(id)) {
      setError("A valid delivery ID is required.");
      setLoading(false);
      return;
    }
    fetchDeliveryDetails();
  }, [id]);

  const fetchDeliveryDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/retail/delivery/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to fetch delivery details");
      }
      const data = await response.json().catch(() => ({}));
      setDelivery(data.delivery);
      setFormData({
        delivery_status: data.delivery.delivery_status || "pending",
        tracking_number: data.delivery.tracking_number || "",
        courier_name: data.delivery.courier_name || "",
        estimated_delivery_date: data.delivery.estimated_delivery_date?.split('T')[0] || "",
        delivery_notes: data.delivery.delivery_notes || "",
        pickup_address: data.delivery.pickup_address || "",
        delivery_address: data.delivery.delivery_address || ""
      });
    } catch (error) {
      console.error("Error loading delivery:", error);
      setError(error.message || "Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (delivery?.order_status === "cancelled" || delivery?.delivery_status === "cancelled") {
      setError("This order was cancelled. Its delivery status can no longer be changed.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/retail/delivery/${id}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Delivery status updated successfully!");
        setTimeout(() => {
          navigate("/retail/delivery-management");
        }, 1500);
      } else {
        console.error("Delivery update request failed:", {
          status: response.status,
          message: data.message
        });
        setError(data.message || "Failed to update delivery");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getStatusProgress = () => {
    const statuses = ["pending", "picked_up", "in_transit", "out_for_delivery", "delivered"];
    const currentIndex = statuses.indexOf(formData.delivery_status);
    return statuses.map((status, index) => ({
      status,
      completed: index <= currentIndex,
      current: index === currentIndex,
      label: statusOptions.find(s => s.value === status)?.label || status
    }));
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading delivery details...</p>
      </div>
    );
  }

  if (!delivery) {
    return (

      <div className="error-state">
        <span>❌</span>
        <h3>Delivery Not Found</h3>
        <p>{error || "The delivery you're looking for doesn't exist."}</p>
        <button onClick={() => navigate("/retail/delivery-management")}>
          Back to Deliveries
        </button>
      </div>
    );
  }

  return (
    <>
    <RetailNavbar />
    <div className="update-delivery">
      <div className="page-header">
        <div>
          <h1>Update Delivery Status</h1>
          <p>Order #{delivery.order_id} - {delivery.product_name}</p>
        </div>
        <button className="back-btn" onClick={() => navigate("/retail/delivery-management")}>
          ← Back to Delivery Management
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="success-message">
          <span>✅</span> {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="delivery-content">
        {delivery.order_status === "cancelled" || delivery.delivery_status === "cancelled" ? (
          <div className="error-message" role="status">
            This order was cancelled by the customer. Delivery updates are disabled.
          </div>
        ) : (
        <>
        {/* Delivery Progress */}
        <div className="delivery-progress">
          <h3>Delivery Progress</h3>
          <div className="progress-track">
            {getStatusProgress().map((step, index) => (
              <div key={step.status} className={`progress-step ${step.completed ? 'completed' : ''} ${step.current ? 'current' : ''}`}>
                <div className="step-circle">
                  {step.completed ? '✓' : index + 1}
                </div>
                <span className="step-label">{step.label}</span>
                {index < getStatusProgress().length - 1 && (
                  <div className={`step-line ${step.completed ? 'completed' : ''}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Update Form */}
        <div className="update-form-container">
          <form onSubmit={handleSubmit} className="update-form">
            {/* Order Info Card */}
            <div className="order-info-card">
              <h3>Order Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Order ID</label>
                  <p>#{delivery.order_id}</p>
                </div>
                <div className="info-item">
                  <label>Product</label>
                  <p>{delivery.product_name}</p>
                </div>
                <div className="info-item">
                  <label>Buyer</label>
                  <p>{delivery.buyer_name}</p>
                </div>
                <div className="info-item">
                  <label>Buyer Phone</label>
                  <p>{delivery.buyer_phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Status Update */}
            <div className="form-section">
              <h3>Update Status</h3>
              
              <div className="form-group">
                <label>Delivery Status *</label>
                <div className="status-options">
                  {statusOptions.map(option => (
                    <label 
                      key={option.value} 
                      className={`status-option ${formData.delivery_status === option.value ? 'selected' : ''}`}
                      style={{ borderColor: formData.delivery_status === option.value ? option.color : '#e0e0e0' }}
                    >
                      <input
                        type="radio"
                        name="delivery_status"
                        value={option.value}
                        checked={formData.delivery_status === option.value}
                        onChange={handleChange}
                      />
                      <span className="option-icon">{option.icon}</span>
                      <span className="option-label">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Courier Service</label>
                  <select 
                    name="courier_name" 
                    value={formData.courier_name} 
                    onChange={handleChange}
                  >
                    <option value="">Select Courier</option>
                    {courierOptions.map(courier => (
                      <option key={courier} value={courier}>{courier}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Tracking Number</label>
                  <input
                    type="text"
                    name="tracking_number"
                    value={formData.tracking_number}
                    onChange={handleChange}
                    placeholder="Enter tracking number"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Estimated Delivery Date</label>
                <input
                  type="date"
                  name="estimated_delivery_date"
                  value={formData.estimated_delivery_date}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Address Information */}
            <div className="form-section">
              <h3>Address Information</h3>
              
              <div className="form-group">
                <label>Pickup Address</label>
                <textarea
                  name="pickup_address"
                  value={formData.pickup_address}
                  onChange={handleChange}
                  placeholder="Enter pickup address"
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label>Delivery Address</label>
                <textarea
                  name="delivery_address"
                  value={formData.delivery_address}
                  onChange={handleChange}
                  placeholder="Enter delivery address"
                  rows="2"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="form-section">
              <h3>Delivery Notes</h3>
              
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="delivery_notes"
                  value={formData.delivery_notes}
                  onChange={handleChange}
                  placeholder="Add any delivery notes or instructions..."
                  rows="4"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => navigate("/retail/delivery-management")}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="save-btn"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-small"></span>
                    Updating...
                  </>
                ) : (
                  "Update Delivery Status"
                )}
              </button>
            </div>
          </form>
        </div>
        </>
        )}
      </div>
    </div>
    </>
  );
}

export default UpdateDelivery;