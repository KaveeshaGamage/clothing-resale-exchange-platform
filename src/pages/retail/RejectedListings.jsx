import { API_BASE_URL } from "../../api.js";

import { useState, useEffect } from "react";
import "../../styles/RejectedListings.css";
import RetailNavbar from "../../components/RetailNavbar.jsx";
import ProductImage from "../../components/ProductImage.jsx";
function RejectedListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedListing, setSelectedListing] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchRejectedListings();
  }, []);

  const fetchRejectedListings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/retail/rejected-listings`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setListings(data.listings || []);
      }
    } catch (error) {
      console.error("Error fetching rejected listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(listing =>
    listing.name?.toLowerCase().includes(search.toLowerCase()) ||
    listing.brand?.toLowerCase().includes(search.toLowerCase()) ||
    listing.seller_name?.toLowerCase().includes(search.toLowerCase())
  );

  const openDetailModal = (listing) => {
    setSelectedListing(listing);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading rejected listings...</p>
      </div>
    );
  }

  return (
    <>
    <RetailNavbar />
    <div className="rejected-listings">
      <div className="page-header">
        <h1>Rejected Listings</h1>
        <p>{listings.length} items were rejected</p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '25px' }}>
        <input
          type="text"
          placeholder="Search rejected listings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '12px 15px',
            border: '2px solid #c8e6c9',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        />
      </div>

      {/* Stats */}
      <div className="summary-row" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '25px'
      }}>
        <div className="summary-card" style={{
          background: 'white',
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid #ffcdd2',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#c62828', fontSize: '1.8rem', margin: '0 0 5px' }}>{listings.length}</h3>
          <p style={{ color: '#666', margin: 0 }}>Total Rejected</p>
        </div>
        <div className="summary-card" style={{
          background: 'white',
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid #ffcdd2',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#c62828', fontSize: '1.8rem', margin: '0 0 5px' }}>
            {listings.filter(l => new Date(l.updated_at).toDateString() === new Date().toDateString()).length}
          </h3>
          <p style={{ color: '#666', margin: 0 }}>Rejected Today</p>
        </div>
      </div>

      {/* Rejected Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="empty-state" style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'white',
          borderRadius: '12px'
        }}>
          <span style={{ fontSize: '50px', display: 'block', marginBottom: '15px' }}>📋</span>
          <h3>No rejected listings found</h3>
          <p style={{ color: '#666' }}>Rejected items will appear here with rejection reasons.</p>
        </div>
      ) : (
        <div className="listings-grid">
          {filteredListings.map(listing => (
            <div key={listing.id} className="listing-card">
              <ProductImage
                src={listing.image_url}
                alt={listing.name} 
              />
              <div className="listing-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#333' }}>{listing.name}</h3>
                  <span className="rejected-badge">✕ Rejected</span>
                </div>
                
                <p style={{ color: '#888', margin: '5px 0' }}>{listing.brand} • {listing.category}</p>
                
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '8px', 
                  margin: '12px 0',
                  fontSize: '0.85rem'
                }}>
                  <span style={{ background: '#ffebee', padding: '4px 10px', borderRadius: '15px', color: '#c62828' }}>
                    Size: {listing.size}
                  </span>
                  <span style={{ background: '#ffebee', padding: '4px 10px', borderRadius: '15px', color: '#c62828' }}>
                    {listing.condition_status}
                  </span>
                </div>

                <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
                  <p style={{ margin: '3px 0' }}><strong>Seller:</strong> {listing.seller_name}</p>
                  <p style={{ margin: '3px 0' }}><strong>Price:</strong> Rs. {parseFloat(listing.price).toLocaleString()}</p>
                  <p style={{ margin: '3px 0' }}>
                    <strong>Rejected:</strong> {new Date(listing.updated_at).toLocaleDateString()}
                  </p>
                </div>

                {listing.rejection_reason && (
                  <div className="rejection-reason">
                    <strong>Reason for Rejection:</strong>
                    <p style={{ margin: '5px 0 0' }}>{listing.rejection_reason}</p>
                  </div>
                )}

                <button
                  onClick={() => openDetailModal(listing)}
                  style={{
                    width: '100%',
                    marginTop: '15px',
                    padding: '10px',
                    background: '#f0f0f0',
                    color: '#333',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedListing && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{
            background: 'white',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '600px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'slideUp 0.3s ease'
          }}>
            <div className="modal-header" style={{
              background: 'linear-gradient(135deg, #c62828, #b71c1c)',
              color: 'white',
              padding: '20px 25px',
              borderRadius: '16px 16px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Rejected Listing Details</h2>
              <button 
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  width: '35px',
                  height: '35px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.2rem'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '25px' }}>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#333', marginBottom: '10px' }}>{selectedListing.name}</h3>
                <p style={{ color: '#666' }}>{selectedListing.brand} • {selectedListing.category}</p>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '15px',
                marginBottom: '20px'
              }}>
                <div>
                  <strong style={{ color: '#888', fontSize: '0.9rem' }}>Size:</strong>
                  <p style={{ color: '#333' }}>{selectedListing.size}</p>
                </div>
                <div>
                  <strong style={{ color: '#888', fontSize: '0.9rem' }}>Condition:</strong>
                  <p style={{ color: '#333' }}>{selectedListing.condition_status}</p>
                </div>
                <div>
                  <strong style={{ color: '#888', fontSize: '0.9rem' }}>Price:</strong>
                  <p style={{ color: '#333' }}>Rs. {parseFloat(selectedListing.price).toLocaleString()}</p>
                </div>
                <div>
                  <strong style={{ color: '#888', fontSize: '0.9rem' }}>Original Price:</strong>
                  <p style={{ color: '#333' }}>Rs. {parseFloat(selectedListing.original_price).toLocaleString()}</p>
                </div>
                <div>
                  <strong style={{ color: '#888', fontSize: '0.9rem' }}>Seller:</strong>
                  <p style={{ color: '#333' }}>{selectedListing.seller_name}</p>
                </div>
                <div>
                  <strong style={{ color: '#888', fontSize: '0.9rem' }}>Receipt #:</strong>
                  <p style={{ color: '#333' }}>{selectedListing.receipt_number || 'N/A'}</p>
                </div>
              </div>

              <div style={{ 
                background: '#fff5f5', 
                padding: '15px', 
                borderRadius: '8px',
                borderLeft: '4px solid #e53935',
                marginBottom: '20px'
              }}>
                <strong style={{ color: '#c62828' }}>Description:</strong>
                <p style={{ color: '#555', marginTop: '8px' }}>{selectedListing.description || 'No description provided'}</p>
              </div>

              {selectedListing.rejection_reason && (
                <div style={{ 
                  background: '#ffebee', 
                  padding: '15px', 
                  borderRadius: '8px',
                  border: '1px solid #ef9a9a'
                }}>
                  <strong style={{ color: '#c62828' }}>Rejection Reason:</strong>
                  <p style={{ color: '#555', marginTop: '8px' }}>{selectedListing.rejection_reason}</p>
                </div>
              )}

              <div style={{ 
                marginTop: '20px', 
                paddingTop: '20px', 
                borderTop: '1px solid #e0e0e0',
                fontSize: '0.85rem',
                color: '#999'
              }}>
                <p>Rejected on: {new Date(selectedListing.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
      `}</style>
    </div>
    </>
  );
}

export default RejectedListings;