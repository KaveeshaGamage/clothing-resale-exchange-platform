import { API_BASE_URL } from "../../api.js";

import { useState, useEffect } from "react";
import "../../styles/ManageListings.css";
import AdminNavbar from "../../components/AdminNavbar.jsx";
import ProductImage from "../../components/ProductImage.jsx";

function ManageListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [retailPartners, setRetailPartners] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedRetailId, setSelectedRetailId] = useState("");
  const [assignNote, setAssignNote] = useState("");

  useEffect(() => {
    fetchListings();
    fetchRetailPartners();
  }, []);

  const fetchListings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/admin/listings`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setListings(data.listings || []);
      }
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRetailPartners = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/admin/users?role=retail`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const retailUsers = data.users?.filter(u => u.role === 'retail') || [];
        setRetailPartners(retailUsers);
      }
    } catch (error) {
      console.error("Error fetching retail partners:", error);
    }
  };

  // Admin directly verify/reject
  const handleVerify = async (productId, status) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}/verify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        setListings(listings.map(l =>
          l.id === productId ? { ...l, verification_status: status } : l
        ));
        alert(`Listing ${status} successfully`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open "Send for Approval" modal
  const handleOpenAssignModal = (listing) => {
    setSelectedListing(listing);
    setSelectedRetailId("");
    setAssignNote("");
    setShowAssignModal(true);
  };

  // Send listing to retail partner for verification
  const handleSendForApproval = async () => {
    if (!selectedRetailId) {
      alert("Please select a retail partner");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/admin/listings/${selectedListing.id}/send-for-approval`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            retail_id: selectedRetailId,
            notes: assignNote
          })
        }
      );

      if (response.ok) {
        setShowAssignModal(false);
        setSelectedListing(null);
        setSelectedRetailId("");
        setAssignNote("");
        alert("Listing sent to retail partner for verification!");
        fetchListings();
      } else {
        const data = await response.json();
        alert(data.message || "Failed to send for approval");
      }
    } catch (error) {
      console.error("Error sending for approval:", error);
      alert("Network error. Please try again.");
    }
  };

  // Publish verified listing to customer shop
  const handlePublish = async (productId) => {
    if (!window.confirm("Publish this item to the customer shop?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/admin/listings/${productId}/publish`,
        {
          method: "PUT",
          headers: { "Authorization": `Bearer ${token}` }
        }
      );

      if (response.ok) {
        setListings(listings.map(l =>
          l.id === productId ? { ...l, is_published: true } : l
        ));
        alert("Listing published to shop!");
      } else {
        const data = await response.json();
        alert(data.message || "Failed to publish listing");
      }
    } catch (error) {
      console.error("Error publishing listing:", error);
      alert("Network error. Please try again.");
    }
  };

  // Unpublish (hide from shop)
  const handleUnpublish = async (productId) => {
    if (!window.confirm("Remove this item from the customer shop?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/admin/listings/${productId}/unpublish`,
        {
          method: "PUT",
          headers: { "Authorization": `Bearer ${token}` }
        }
      );

      if (response.ok) {
        setListings(listings.map(l =>
          l.id === productId ? { ...l, is_published: false } : l
        ));
        alert("Listing removed from shop!");
      } else {
        const data = await response.json();
        alert(data.message || "Failed to unpublish listing");
      }
    } catch (error) {
      console.error("Error unpublishing listing:", error);
      alert("Network error. Please try again.");
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Delete this listing? This action cannot be undone.")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/admin/listings/${productId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        setListings(listings.filter(l => l.id !== productId));
        alert("Listing deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting listing:", error);
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch =
      listing.name?.toLowerCase().includes(search.toLowerCase()) ||
      listing.brand?.toLowerCase().includes(search.toLowerCase()) ||
      listing.seller_name?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || listing.verification_status === filter;
    return matchesSearch && matchesFilter;
  });

  // Stats
  const stats = {
    total: listings.length,
    pending: listings.filter(l => l.verification_status === 'pending').length,
    verified: listings.filter(l => l.verification_status === 'verified').length,
    rejected: listings.filter(l => l.verification_status === 'rejected').length
  };

  if (loading) return (
    <>
      <AdminNavbar />
      <div className="loading"><div className="spinner"></div><p>Loading listings...</p></div>
    </>
  );

  return (
    <>
      <AdminNavbar />
      <div className="manage-listings">
        {/* Page Header */}
        <div className="page-header" style={{
          background: 'linear-gradient(135deg, #1b5e20, #2e7d32)',
          color: 'white',
          padding: '25px 30px',
          borderRadius: '12px',
          marginBottom: '25px',
          boxShadow: '0 4px 15px rgba(46,125,50,0.3)'
        }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Manage Listings</h1>
          <p style={{ margin: '5px 0 0', opacity: 0.9 }}>
            Verify, reject, assign to retail partners, or publish items to the shop
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '15px',
          marginBottom: '25px'
        }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e8f5e9' }}>
            <h3 style={{ color: '#333', fontSize: '1.8rem', margin: '0 0 5px' }}>{stats.total}</h3>
            <p style={{ color: '#666', margin: 0 }}>Total Listings</p>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', border: '1px solid #fff3cd' }}>
            <h3 style={{ color: '#f57f17', fontSize: '1.8rem', margin: '0 0 5px' }}>{stats.pending}</h3>
            <p style={{ color: '#666', margin: 0 }}>Pending</p>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', border: '1px solid #c8e6c9' }}>
            <h3 style={{ color: '#2e7d32', fontSize: '1.8rem', margin: '0 0 5px' }}>{stats.verified}</h3>
            <p style={{ color: '#666', margin: 0 }}>Verified</p>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '10px', textAlign: 'center', border: '1px solid #ffcdd2' }}>
            <h3 style={{ color: '#c62828', fontSize: '1.8rem', margin: '0 0 5px' }}>{stats.rejected}</h3>
            <p style={{ color: '#666', margin: 0 }}>Rejected</p>
          </div>
        </div>

        {/* Controls */}
        <div className="controls" style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search listings by name, brand, or seller..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
            style={{
              flex: 1,
              minWidth: '250px',
              padding: '12px 15px',
              border: '2px solid #c8e6c9',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '12px 15px',
              border: '2px solid #c8e6c9',
              borderRadius: '8px',
              fontSize: '1rem',
              background: 'white',
              cursor: 'pointer',
              minWidth: '150px'
            }}
          >
            <option value="all">All Listings</option>
            <option value="pending">⏳ Pending</option>
            <option value="verified">✅ Verified</option>
            <option value="rejected">❌ Rejected</option>
          </select>
        </div>

        {/* Listings Grid */}
        {filteredListings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px' }}>
            <span style={{ fontSize: '50px', display: 'block', marginBottom: '15px' }}>📦</span>
            <h3>No listings found</h3>
            <p style={{ color: '#666' }}>No listings match your current filter criteria.</p>
          </div>
        ) : (
          <div className="listings-grid">
            {filteredListings.map(listing => (
              <div key={listing.id} className="listing-card" style={{
                background: 'white',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                border: '1px solid #e8f5e9',
                transition: 'all 0.3s'
              }}>
                <ProductImage
                  src={listing.image_url}
                  alt={listing.name}
                  style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                />
                <div className="listing-info" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1b5e20' }}>{listing.name}</h3>
                    <span className={`badge badge-${listing.verification_status}`} style={{
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: listing.verification_status === 'verified' ? '#c8e6c9' :
                                  listing.verification_status === 'pending' ? '#fff3cd' : '#ffcdd2',
                      color: listing.verification_status === 'verified' ? '#1b5e20' :
                             listing.verification_status === 'pending' ? '#f57f17' : '#b71c1c'
                    }}>
                      {listing.verification_status}
                    </span>
                  </div>

                  <p style={{ color: '#666', margin: '5px 0' }}>{listing.brand} • {listing.category}</p>
                  <p style={{ color: '#666', margin: '5px 0', fontSize: '0.9rem' }}>
                    Size: {listing.size} | Condition: {listing.condition_status}
                  </p>
                  <p style={{ color: '#2e7d32', fontWeight: 700, fontSize: '1.1rem', margin: '10px 0' }}>
                    Rs. {parseFloat(listing.price).toLocaleString()}
                  </p>
                  <p style={{ color: '#666', margin: '5px 0', fontSize: '0.9rem' }}>
                    Seller: {listing.seller_name}
                  </p>

                  {/* Published badge */}
                  {listing.is_published && (
                    <p style={{
                      margin: '8px 0 0',
                      padding: '6px 12px',
                      background: '#e8f5e9',
                      color: '#2e7d32',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      display: 'inline-block'
                    }}>
                      🛒 Live in Shop
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="actions" style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                    {listing.verification_status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleOpenAssignModal(listing)}
                          className="assign-btn"
                          style={{
                            padding: '10px 18px',
                            background: 'linear-gradient(135deg, #2196F3, #1976D2)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            flex: 1,
                            minWidth: '100%'
                          }}
                        >
                          📤 Send for Approval to Retail Partner
                        </button>
                        <button
                          onClick={() => handleVerify(listing.id, 'verified')}
                          className="verify-btn"
                          style={{
                            padding: '10px 18px',
                            background: 'linear-gradient(135deg, #4caf50, #388e3c)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            flex: 1
                          }}
                        >
                          ✓ Verify Directly
                        </button>
                        <button
                          onClick={() => handleVerify(listing.id, 'rejected')}
                          className="reject-btn"
                          style={{
                            padding: '10px 18px',
                            background: 'linear-gradient(135deg, #ff8f00, #ff6f00)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            flex: 1
                          }}
                        >
                          ✕ Reject
                        </button>
                      </>
                    )}

                    {listing.verification_status === 'verified' && !listing.is_published && (
                      <button
                        onClick={() => handlePublish(listing.id)}
                        className="publish-btn"
                        style={{
                          padding: '10px 18px',
                          background: 'linear-gradient(135deg, #8e24aa, #6a1b9a)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          flex: 1,
                          minWidth: '100%'
                        }}
                      >
                        🛒 Publish to Shop (Show to Customers)
                      </button>
                    )}

                    {listing.verification_status === 'verified' && listing.is_published && (
                      <button
                        onClick={() => handleUnpublish(listing.id)}
                        className="unpublish-btn"
                        style={{
                          padding: '10px 18px',
                          background: 'linear-gradient(135deg, #757575, #424242)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          flex: 1,
                          minWidth: '100%'
                        }}
                      >
                        🚫 Remove from Shop
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(listing.id)}
                      className="delete-btn"
                      style={{
                        padding: '10px 18px',
                        background: 'linear-gradient(135deg, #ef5350, #c62828)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        flex: 1
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Send for Approval Modal */}
        {showAssignModal && selectedListing && (
          <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="modal" style={{
              background: 'white',
              borderRadius: '16px',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'slideUp 0.3s ease'
            }}>
              <div className="modal-header" style={{
                background: 'linear-gradient(135deg, #1b5e20, #2e7d32)',
                color: 'white',
                padding: '20px 25px',
                borderRadius: '16px 16px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>📤 Send to Retail Partner for Approval</h2>
                <button
                  onClick={() => setShowAssignModal(false)}
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
                <p style={{ marginBottom: '15px', color: '#555' }}>
                  <strong>Listing:</strong> {selectedListing.name}
                </p>
                <p style={{ marginBottom: '20px', color: '#555' }}>
                  <strong>Seller:</strong> {selectedListing.seller_name}
                </p>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
                    Select Retail Partner *
                  </label>
                  <select
                    value={selectedRetailId}
                    onChange={(e) => setSelectedRetailId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '2px solid #c8e6c9',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      background: 'white'
                    }}
                  >
                    <option value="">-- Select Retail Partner --</option>
                    {retailPartners.map(partner => (
                      <option key={partner.id} value={partner.id}>
                        {partner.fullName || partner.full_name} ({partner.email})
                      </option>
                    ))}
                  </select>
                  {retailPartners.length === 0 && (
                    <small style={{ color: '#c62828', display: 'block', marginTop: '6px' }}>
                      No retail partners registered yet.
                    </small>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
                    Note for Retail Partner
                  </label>
                  <textarea
                    value={assignNote}
                    onChange={(e) => setAssignNote(e.target.value)}
                    placeholder="Add any instructions or notes..."
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '2px solid #c8e6c9',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              <div style={{
                padding: '20px 25px',
                borderTop: '1px solid #e8f5e9',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setShowAssignModal(false)}
                  style={{
                    padding: '10px 20px',
                    background: '#f0f0f0',
                    color: '#333',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.95rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendForApproval}
                  style={{
                    padding: '10px 25px',
                    background: 'linear-gradient(135deg, #4caf50, #388e3c)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: 600
                  }}
                >
                  📤 Send for Approval
                </button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </>
  );
}

export default ManageListings;