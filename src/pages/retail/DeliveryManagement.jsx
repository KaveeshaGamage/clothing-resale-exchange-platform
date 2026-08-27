import { useState, useEffect } from "react";
import "../../styles/DeliveryManagement.css";
import RetailNavbar from "../../components/RetailNavbar";

function DeliveryManagement() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/retail/deliveries", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDeliveries(data.deliveries || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/retail/delivery/${selectedDelivery.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          tracking_number: trackingNumber,
          notes: deliveryNote
        })
      });
      
      if (response.ok) {
        setDeliveries(deliveries.map(d => 
          d.id === selectedDelivery.id 
            ? { ...d, delivery_status: newStatus, tracking_number: trackingNumber }
            : d
        ));
        setShowUpdateModal(false);
        alert("Delivery status updated!");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Pending', class: 'badge-pending' },
      picked_up: { text: 'Picked Up', class: 'badge-picked' },
      in_transit: { text: 'In Transit', class: 'badge-transit' },
      out_for_delivery: { text: 'Out for Delivery', class: 'badge-out' },
      delivered: { text: 'Delivered', class: 'badge-delivered' },
      failed: { text: 'Failed', class: 'badge-failed' }
    };
    const badge = badges[status] || badges.pending;
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  const filteredDeliveries = filter === "all" 
    ? deliveries 
    : deliveries.filter(d => d.delivery_status === filter);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <>
      <RetailNavbar />
      
    <div className="delivery-management">
      <div className="page-header">
        <h1>Delivery Management</h1>
        <p>Track and manage all deliveries</p>
      </div>

      <div className="filter-tabs">
        <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
        <button className={`tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Pending</button>
        <button className={`tab ${filter === 'picked_up' ? 'active' : ''}`} onClick={() => setFilter('picked_up')}>Picked Up</button>
        <button className={`tab ${filter === 'in_transit' ? 'active' : ''}`} onClick={() => setFilter('in_transit')}>In Transit</button>
        <button className={`tab ${filter === 'out_for_delivery' ? 'active' : ''}`} onClick={() => setFilter('out_for_delivery')}>Out for Delivery</button>
        <button className={`tab ${filter === 'delivered' ? 'active' : ''}`} onClick={() => setFilter('delivered')}>Delivered</button>
      </div>

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
            {filteredDeliveries.map(delivery => (
              <tr key={delivery.id}>
                <td>#{delivery.order_id}</td>
                <td>{delivery.product_name}</td>
                <td>{delivery.buyer_name}</td>
                <td className="address-cell">{delivery.delivery_address}</td>
                <td>{getStatusBadge(delivery.delivery_status)}</td>
                <td>{delivery.tracking_number || '-'}</td>
                <td>{new Date(delivery.created_at).toLocaleDateString()}</td>
                <td>
                  <button 
                    className="update-btn"
                    onClick={() => {
                      setSelectedDelivery(delivery);
                      setNewStatus(delivery.delivery_status);
                      setTrackingNumber(delivery.tracking_number || '');
                      setShowUpdateModal(true);
                    }}
                  >
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Update Status Modal */}
      {showUpdateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Update Delivery Status</h2>
              <button className="close-btn" onClick={() => setShowUpdateModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p><strong>Order:</strong> #{selectedDelivery?.order_id}</p>
              <p><strong>Product:</strong> {selectedDelivery?.product_name}</p>
              
              <div className="form-group">
                <label>Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="in_transit">In Transit</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                />
              </div>
              
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  placeholder="Add delivery notes..."
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowUpdateModal(false)}>Cancel</button>
              <button className="save-btn" onClick={handleUpdateStatus}>Update Status</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default DeliveryManagement;