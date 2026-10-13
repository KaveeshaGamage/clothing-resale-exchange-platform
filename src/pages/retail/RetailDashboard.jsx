import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RetailNavbar from "../../components/RetailNavbar.jsx";
import ProductImage from "../../components/ProductImage.jsx";
import { API_BASE_URL } from "../../api.js";
import "../../styles/RetailDashboard.css";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const deliveryLabels = {
  pending: "Awaiting pickup",
  picked_up: "Picked up",
  in_transit: "In transit",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  failed: "Needs attention",
};

function RetailDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Your session has ended. Please log in to view this dashboard.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/retail/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to load the partner dashboard.");
      }
      setDashboard(data);
    } catch (loadError) {
      console.error("Retail dashboard request failed:", loadError);
      setError(loadError.message || "Unable to reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = dashboard?.stats || {};

  return (
    <>
      <RetailNavbar />
      <main className="retail-dashboard">
        <section className="retail-dashboard-heading">
          <div>
            <span className="retail-dashboard-kicker">PARTNER OVERVIEW</span>
            <h1>Your day, at a glance.</h1>
            <p>Keep listings moving and deliveries on their way.</p>
          </div>
          <Link to="/retail/pending-verification" className="retail-dashboard-primary">
            Review listings <span aria-hidden="true">↗</span>
          </Link>
        </section>

        {error && (
          <div className="retail-state retail-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={loadDashboard}>Try again</button>
            {!localStorage.getItem("token") && <Link to="/login">Go to login</Link>}
          </div>
        )}

        {loading ? (
          <div className="retail-state" role="status">Loading partner activity…</div>
        ) : (
          dashboard && (
            <>
              <section className="retail-stat-grid" aria-label="Partner activity">
                <article className="retail-stat-card">
                  <div className="retail-stat-top">
                    <span>Needs review</span><span className="retail-stat-symbol amber">◷</span>
                  </div>
                  <strong>{stats.pendingVerifications ?? 0}</strong>
                  <Link to="/retail/pending-verification">Pending verification <span>→</span></Link>
                </article>
                <article className="retail-stat-card">
                  <div className="retail-stat-top">
                    <span>Approved today</span><span className="retail-stat-symbol green">✓</span>
                  </div>
                  <strong>{stats.approvedToday ?? 0}</strong>
                  <Link to="/retail/approved-listings">View approved listings <span>→</span></Link>
                </article>
                <article className="retail-stat-card">
                  <div className="retail-stat-top">
                    <span>On the move</span><span className="retail-stat-symbol blue">↗</span>
                  </div>
                  <strong>{stats.activeDeliveries ?? 0}</strong>
                  <Link to="/retail/delivery-management">Active deliveries <span>→</span></Link>
                </article>
                <article className="retail-stat-card">
                  <div className="retail-stat-top">
                    <span>Delivered today</span><span className="retail-stat-symbol violet">⌁</span>
                  </div>
                  <strong>{stats.deliveredToday ?? 0}</strong>
                  <Link to="/retail/delivery-management">Delivery management <span>→</span></Link>
                </article>
              </section>

              <section className="retail-dashboard-columns">
                <div className="retail-dashboard-panel retail-verifications-panel">
                  <div className="retail-panel-heading">
                    <div>
                      <span className="retail-dashboard-kicker">LISTING QUEUE</span>
                      <h2>Latest verifications</h2>
                    </div>
                    <Link to="/retail/pending-verification">Open queue <span>→</span></Link>
                  </div>
                  {dashboard.recentListings?.length ? (
                    <div className="retail-listing-list">
                      {dashboard.recentListings.map((listing) => (
                        <div className="retail-listing-row" key={listing.id}>
                          {listing.image_url ? (
                            <ProductImage src={listing.image_url} alt="" loading="lazy" />
                          ) : (
                            <span className="retail-listing-placeholder">R</span>
                          )}
                          <span className="retail-listing-info">
                            <strong>{listing.name}</strong>
                            <small>{listing.brand} · {listing.seller_name}</small>
                          </span>
                          <span className={`retail-verification-badge verification-${listing.verification_status}`}>
                            {listing.verification_status}
                          </span>
                          <small className="retail-listing-date">{formatDate(listing.created_at)}</small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="retail-empty-state">
                      <span>✓</span>
                      <strong>You’re all caught up.</strong>
                      <p>New listings assigned to your store will appear here.</p>
                    </div>
                  )}
                </div>

                <div className="retail-dashboard-panel retail-deliveries-panel">
                  <div className="retail-panel-heading">
                    <div>
                      <span className="retail-dashboard-kicker">LAST MILE</span>
                      <h2>Recent deliveries</h2>
                    </div>
                    <Link to="/retail/delivery-management">View all <span>→</span></Link>
                  </div>
                  {dashboard.recentDeliveries?.length ? (
                    <div className="retail-delivery-list">
                      {dashboard.recentDeliveries.map((delivery) => (
                        <Link
                          className="retail-delivery-row"
                          to={`/retail/update-delivery/${delivery.id}`}
                          key={delivery.id}
                        >
                          <span className="retail-delivery-icon">↗</span>
                          <span className="retail-delivery-info">
                            <strong>{delivery.product_name || `Order #${delivery.order_id}`}</strong>
                            <small>{delivery.buyer_name || "Customer"} · {formatDate(delivery.created_at)}</small>
                          </span>
                          <span className={`retail-delivery-status delivery-${delivery.delivery_status}`}>
                            {deliveryLabels[delivery.delivery_status] || delivery.delivery_status}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="retail-empty-state retail-delivery-empty">
                      <span>⌁</span>
                      <strong>No deliveries yet.</strong>
                      <p>Your delivery tasks will appear here.</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="retail-workflow">
                <div>
                  <span className="retail-dashboard-kicker">YOUR WORKFLOW</span>
                  <h2>Small steps make a big difference.</h2>
                </div>
                <Link to="/retail/pending-verification"><span>01</span> Verify a listing <b>→</b></Link>
                <Link to="/retail/approved-listings"><span>02</span> Browse approved pieces <b>→</b></Link>
                <Link to="/retail/delivery-management"><span>03</span> Update deliveries <b>→</b></Link>
              </section>
            </>
          )
        )}
        <footer className="retail-dashboard-footer">ReWear Partner · Thanks for keeping fashion in circulation.</footer>
      </main>
    </>
  );
}

export default RetailDashboard;
