import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CustomerNavbar from "../../components/CustomerNavbar";
import "../../styles/MyListings.css";

function MyListings() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedListing, setSelectedListing] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchMyListings();
  }, []);

  const fetchMyListings = async () => {
    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("Please login first");
        setLoading(false);
        return;
      }

      console.log("Fetching listings with token:", token.substring(0, 20) + "..."); // Debug

      const response = await fetch("http://localhost:5000/api/products/my-listings", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      console.log("Response status:", response.status); // Debug

      const data = await response.json();
      console.log("Response data:", data); // Debug

      if (response.ok && data.success) {
        setListings(data.products || []);
        console.log(`Loaded ${data.products?.length || 0} listings`); // Debug
      } else {
        setError(data.message || "Failed to fetch listings");
      }
    } catch (error) {
      console.error("Error fetching listings:", error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (listing) => {
    setSelectedListing(listing);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedListing) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/products/${selectedListing.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setListings(listings.filter(item => item.id !== selectedListing.id));
        setShowDeleteModal(false);
        setSelectedListing(null);
        alert("Listing removed successfully");
      } else {
        alert(data.message || "Failed to remove listing");
      }
    } catch (error) {
      console.error("Error deleting listing:", error);
      alert("Network error. Please try again.");
    }
  };

  const handleEdit = (listingId) => {
    navigate(`/customer/dashboard/edit-listing/${listingId}`);
  };

  const getFilteredListings = () => {
    switch (activeFilter) {
      case "active":
        return listings.filter(item => item.status === "available" && item.verification_status === "verified");
      case "pending":
        return listings.filter(item => item.verification_status === "pending");
      case "sold":
        return listings.filter(item => item.status === "sold");
      case "rejected":
        return listings.filter(item => item.verification_status === "rejected");
      default:
        return listings;
    }
  };

  const getStatusBadge = (status, verificationStatus) => {
    if (status === 'sold') {
      return <span className="badge badge-sold">Sold</span>;
    }
    if (status === 'removed') {
      return <span className="badge badge-removed">Removed</span>;
    }
    if (verificationStatus === 'pending') {
      return <span className="badge badge-pending">⏳ Pending Verification</span>;
    }
    if (verificationStatus === 'rejected') {
      return <span className="badge badge-rejected">❌ Rejected</span>;
    }
    if (verificationStatus === 'verified') {
      return <span className="badge badge-active">✅ Active</span>;
    }
  };

  const calculateDiscount = (originalPrice, sellingPrice) => {
    if (!originalPrice || !sellingPrice || originalPrice === 0) return 0;
    return Math.round(((parseFloat(originalPrice) - parseFloat(sellingPrice)) / parseFloat(originalPrice)) * 100);
  };

  const filteredListings = getFilteredListings();
  
  const stats = {
    total: listings.length,
    active: listings.filter(item => item.status === "available" && item.verification_status === "verified").length,
    pending: listings.filter(item => item.verification_status === "pending").length,
    sold: listings.filter(item => item.status === "sold").length
  };

  if (loading) {
    return (
      <>
        <CustomerNavbar />
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading your listings...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <CustomerNavbar />
      <div className="my-listings-page">
        <div className="listings-header">
          <div>
            <h1>My Listings</h1>
            <p>Manage your items for sale</p>
          </div>
          <button 
            className="add-listing-btn"
            onClick={() => navigate("/customer/sell-item")}
          >
            + List New Item
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message" style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            {error}
            <button 
              onClick={fetchMyListings}
              style={{
                marginLeft: '15px',
                padding: '5px 15px',
                background: '#721c24',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="listing-stats">
          <div className="stat-card">
            <span className="stat-icon">📦</span>
            <div className="stat-info">
              <h3>{stats.total}</h3>
              <p>Total Listings</p>
            </div>
          </div>
          <div className="stat-card active">
            <span className="stat-icon">✅</span>
            <div className="stat-info">
              <h3>{stats.active}</h3>
              <p>Active</p>
            </div>
          </div>
          <div className="stat-card pending">
            <span className="stat-icon">⏳</span>
            <div className="stat-info">
              <h3>{stats.pending}</h3>
              <p>Pending</p>
            </div>
          </div>
          <div className="stat-card sold">
            <span className="stat-icon">💰</span>
            <div className="stat-info">
              <h3>{stats.sold}</h3>
              <p>Sold</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button 
            className={`tab ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All ({stats.total})
          </button>
          <button 
            className={`tab ${activeFilter === 'active' ? 'active' : ''}`}
            onClick={() => setActiveFilter('active')}
          >
            Active ({stats.active})
          </button>
          <button 
            className={`tab ${activeFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveFilter('pending')}
          >
            Pending ({stats.pending})
          </button>
          <button 
            className={`tab ${activeFilter === 'sold' ? 'active' : ''}`}
            onClick={() => setActiveFilter('sold')}
          >
            Sold ({stats.sold})
          </button>
        </div>

        {/* Listings Grid */}
        {filteredListings.length === 0 ? (
          <div className="no-listings">
            <span className="empty-icon">📦</span>
            <h3>No listings found</h3>
            <p>Start selling your unused clothes today!</p>
            <button onClick={() => navigate("/customer/sell-item")}>
              List Your First Item
            </button>
          </div>
        ) : (
          <div className="listings-grid">
            {filteredListings.map(listing => (
              <div key={listing.id} className="listing-card">
                <div className="listing-image">
                  <img 
                    src={listing.image_url || "https://via.placeholder.com/300x200?text=No+Image"} 
                    alt={listing.name} 
                  />
                  {getStatusBadge(listing.status, listing.verification_status)}
                  {listing.status === 'available' && listing.verification_status === 'verified' && (
                    <div className="discount-badge">
                      -{calculateDiscount(listing.original_price, listing.price)}%
                    </div>
                  )}
                </div>

                <div className="listing-info">
                  <h3>{listing.name}</h3>
                  <p className="brand-category">{listing.brand} • {listing.category}</p>
                  
                  <div className="listing-details">
                    <span className="detail">Size: {listing.size}</span>
                    <span className="detail">Color: {listing.color || 'N/A'}</span>
                    <span className="detail">Condition: {listing.condition_status}</span>
                  </div>

                  {listing.description && (
                    <p className="description">{listing.description}</p>
                  )}

                  <div className="listing-price">
                    <div className="price-row">
                      <span className="selling-price">Rs. {parseFloat(listing.price).toLocaleString()}</span>
                      <span className="original-price">Rs. {parseFloat(listing.original_price).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="listing-meta">
                    <span>📅 {new Date(listing.created_at).toLocaleDateString()}</span>
                  </div>

                  {listing.status === 'available' && listing.verification_status !== 'rejected' && (
                    <div className="listing-actions">
                      <button 
                        className="edit-btn"
                        onClick={() => handleEdit(listing.id)}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDelete(listing)}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  )}

                  {listing.verification_status === 'rejected' && (
                    <div className="rejected-message">
                      <p>❌ This listing was rejected. Please review and resubmit.</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Remove Listing</h3>
              <p>Are you sure you want to remove "{selectedListing?.name}"?</p>
              <p className="modal-warning">This action cannot be undone.</p>
              <div className="modal-actions">
                <button 
                  className="modal-cancel-btn"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="modal-delete-btn"
                  onClick={confirmDelete}
                >
                  Remove Listing
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default MyListings;