import { useState, useEffect } from "react";
import "../../styles/ApprovedListings.css";
import RetailNavbar from "../../components/RetailNavbar";
function ApprovedListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchApprovedListings();
  }, []);

  const fetchApprovedListings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/retail/approved-listings", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setListings(data.listings || []);
      }
    } catch (error) {
      console.error("Error fetching approved listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.name?.toLowerCase().includes(search.toLowerCase()) ||
                         listing.brand?.toLowerCase().includes(search.toLowerCase()) ||
                         listing.seller_name?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || listing.category === filter;
    return matchesSearch && matchesFilter;
  });

  // Get unique categories for filter
  const categories = [...new Set(listings.map(l => l.category))];

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading approved listings...</p>
      </div>
    );
  }

  return (
    <>
        <RetailNavbar />
    <div className="approved-listings">
      <div className="page-header">
        <h1>Approved Listings</h1>
        <p>{listings.length} verified items ready for sale</p>
      </div>

      {/* Controls */}
      <div className="controls" style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name, brand or seller..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
            minWidth: '180px'
          }}
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Stats Summary */}
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
          border: '1px solid #e8f5e9',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#2e7d32', fontSize: '1.8rem', margin: '0 0 5px' }}>{listings.length}</h3>
          <p style={{ color: '#666', margin: 0 }}>Total Approved</p>
        </div>
        <div className="summary-card" style={{
          background: 'white',
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid #e8f5e9',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#2e7d32', fontSize: '1.8rem', margin: '0 0 5px' }}>
            {listings.filter(l => l.status === 'available').length}
          </h3>
          <p style={{ color: '#666', margin: 0 }}>Available</p>
        </div>
        <div className="summary-card" style={{
          background: 'white',
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid #e8f5e9',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#2e7d32', fontSize: '1.8rem', margin: '0 0 5px' }}>
            {listings.filter(l => l.status === 'sold').length}
          </h3>
          <p style={{ color: '#666', margin: 0 }}>Sold</p>
        </div>
      </div>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="empty-state" style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'white',
          borderRadius: '12px'
        }}>
          <span style={{ fontSize: '50px', display: 'block', marginBottom: '15px' }}>📦</span>
          <h3>No approved listings found</h3>
          <p style={{ color: '#666' }}>All verified listings will appear here.</p>
        </div>
      ) : (
        <div className="listings-grid">
          {filteredListings.map(listing => (
            <div key={listing.id} className="listing-card">
              <img 
                src={listing.image_url || "https://via.placeholder.com/300x200?text=No+Image"} 
                alt={listing.name} 
              />
              <div className="listing-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{listing.name}</h3>
                  <span className="approved-badge">✓ Approved</span>
                </div>
                
                <p style={{ color: '#888', margin: '5px 0' }}>{listing.brand} • {listing.category}</p>
                
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '8px', 
                  margin: '12px 0',
                  fontSize: '0.85rem',
                  color: '#555'
                }}>
                  <span style={{ background: '#e8f5e9', padding: '4px 10px', borderRadius: '15px' }}>
                    Size: {listing.size}
                  </span>
                  <span style={{ background: '#e8f5e9', padding: '4px 10px', borderRadius: '15px' }}>
                    Condition: {listing.condition_status}
                  </span>
                  {listing.color && (
                    <span style={{ background: '#e8f5e9', padding: '4px 10px', borderRadius: '15px' }}>
                      Color: {listing.color}
                    </span>
                  )}
                </div>

                <div style={{ 
                  background: 'linear-gradient(135deg, #e8f5e9, #f1f8e9)',
                  padding: '12px',
                  borderRadius: '8px',
                  margin: '12px 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 700, color: '#2e7d32', fontSize: '1.2rem' }}>
                    Rs. {parseFloat(listing.price).toLocaleString()}
                  </span>
                  <span style={{ color: '#999', textDecoration: 'line-through', fontSize: '0.9rem' }}>
                    Rs. {parseFloat(listing.original_price).toLocaleString()}
                  </span>
                </div>

                <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
                  <p style={{ margin: '3px 0' }}><strong>Seller:</strong> {listing.seller_name}</p>
                  <p style={{ margin: '3px 0' }}><strong>Listed:</strong> {new Date(listing.created_at).toLocaleDateString()}</p>
                  <p style={{ margin: '3px 0' }}>
                    <strong>Status:</strong>{' '}
                    <span style={{ 
                      color: listing.status === 'sold' ? '#2196F3' : '#4caf50',
                      fontWeight: 600
                    }}>
                      {listing.status === 'sold' ? 'Sold' : 'Available'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}

export default ApprovedListings;