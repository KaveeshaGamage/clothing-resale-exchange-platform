import { API_BASE_URL } from "../../api.js";

import { useState, useEffect } from "react";
import "../../styles/PendingVerifications.css";
import RetailNavbar from "../../components/RetailNavbar.jsx";
import ProductImage from "../../components/ProductImage.jsx";
function PendingVerifications() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [verificationNote, setVerificationNote] = useState("");
  const [action, setAction] = useState("");

  useEffect(() => {
    fetchPendingListings();
  }, []);

  const fetchPendingListings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/retail/pending-verifications`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setListings(data.listings || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (productId, status) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/retail/verify/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status, 
          notes: verificationNote 
        })
      });
      
      if (response.ok) {
        setListings(listings.filter(l => l.id !== productId));
        setShowModal(false);
        setVerificationNote("");
        alert(`Listing ${status} successfully!`);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const openVerifyModal = (listing, actionType) => {
    setSelectedListing(listing);
    setAction(actionType);
    setShowModal(true);
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <>
      <RetailNavbar />
     
    <div className="pending-verifications">
      <div className="page-header">
        <h1>Pending Verifications</h1>
        <p>{listings.length} items waiting for verification</p>
      </div>

      {listings.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">✅</span>
          <h3>All Caught Up!</h3>
          <p>No pending verifications at the moment.</p>
        </div>
      ) : (
        <div className="verification-list">
          {listings.map(listing => (
            <div key={listing.id} className="verification-card">
              <div className="card-image">
                <ProductImage src={listing.image_url} alt={listing.name} />
              </div>
              <div className="card-content">
                <div className="card-header">
                  <h3>{listing.name}</h3>
                  <span className="pending-badge">Pending</span>
                </div>
                
                <div className="card-details">
                  <div className="detail-row">
                    <span>Brand:</span> <strong>{listing.brand}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Category:</span> <strong>{listing.category}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Size:</span> <strong>{listing.size}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Condition:</span> <strong>{listing.condition_status}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Price:</span> <strong>Rs. {parseFloat(listing.price).toLocaleString()}</strong>
                  </div>
                </div>

                <div className="verification-info">
                  <h4>Purchase Verification</h4>
                  <p><strong>Receipt #:</strong> {listing.receipt_number || 'N/A'}</p>
                  <p><strong>Order #:</strong> {listing.order_number || 'N/A'}</p>
                  <p><strong>Seller:</strong> {listing.seller_name}</p>
                  <p><strong>Description:</strong> {listing.description}</p>
                </div>

                <div className="card-actions">
                  <button 
                    className="approve-btn"
                    onClick={() => openVerifyModal(listing, 'verified')}
                  >
                    ✓ Approve
                  </button>
                  <button 
                    className="reject-btn"
                    onClick={() => openVerifyModal(listing, 'rejected')}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verification Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{action === 'verified' ? '✓ Approve' : '✕ Reject'} Listing</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p><strong>Item:</strong> {selectedListing?.name}</p>
              <div className="form-group">
                <label>Verification Notes:</label>
                <textarea
                  value={verificationNote}
                  onChange={(e) => setVerificationNote(e.target.value)}
                  placeholder="Add notes about this verification..."
                  rows="4"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button 
                className={action === 'verified' ? 'approve-btn' : 'reject-btn'}
                onClick={() => handleVerify(selectedListing?.id, action)}
              >
                {action === 'verified' ? '✓ Confirm Approve' : '✕ Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default PendingVerifications;