import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminNavbar from "../../components/AdminNavbar.jsx";
import { API_BASE_URL } from "../../api.js";
import "../../styles/AdminDashboard.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
      })
    : "—";

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Your session has ended. Please log in to view the admin dashboard.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to load the admin dashboard.");
      }
      setDashboard(data);
    } catch (loadError) {
      console.error("Admin dashboard request failed:", loadError);
      setError(loadError.message || "Unable to reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = dashboard?.stats || {};
  const sales = dashboard?.dailySales || [];
  const maxSales = Math.max(...sales.map((day) => Number(day.revenue) || 0), 1);

  return (
    <>
      <AdminNavbar />
      <main className="admin-dashboard">
        <section className="admin-dashboard-heading">
          <div>
            <span className="admin-dashboard-kicker">PLATFORM OVERVIEW</span>
            <h1>Everything in good order.</h1>
            <p>Here’s what’s happening across ReWear today.</p>
          </div>
          <div className="admin-dashboard-date">
            <span className="admin-date-icon">◷</span>
            <span>
              <small>TODAY</small>
              <strong>{new Date().toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}</strong>
            </span>
          </div>
        </section>

        {error && (
          <div className="admin-state admin-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={loadDashboard}>Try again</button>
            {!localStorage.getItem("token") && <Link to="/login">Go to login</Link>}
          </div>
        )}

        {loading ? (
          <div className="admin-state" role="status">Gathering platform activity…</div>
        ) : (
          dashboard && (
            <>
              <section className="admin-stat-grid" aria-label="Platform statistics">
                <article className="admin-stat-card">
                  <div className="admin-stat-label"><span className="admin-stat-icon users-icon">♧</span>Community members</div>
                  <strong>{stats.totalUsers ?? 0}</strong>
                  <small>Registered across all roles</small>
                </article>
                <article className="admin-stat-card">
                  <div className="admin-stat-label"><span className="admin-stat-icon listings-icon">◈</span>Active listings</div>
                  <strong>{stats.totalListings ?? 0}</strong>
                  <small>Clothing pieces on the platform</small>
                </article>
                <article className="admin-stat-card">
                  <div className="admin-stat-label"><span className="admin-stat-icon orders-icon">▤</span>Total orders</div>
                  <strong>{stats.totalOrders ?? 0}</strong>
                  <small>All orders to date</small>
                </article>
                <article className="admin-stat-card admin-revenue-card">
                  <div className="admin-stat-label"><span className="admin-stat-icon revenue-icon">↗</span>Platform sales</div>
                  <strong>{formatCurrency(stats.totalRevenue)}</strong>
                  <small>Excluding cancelled orders</small>
                </article>
              </section>

              <section className="admin-attention-strip" aria-label="Items needing attention">
                <div className="admin-attention-copy">
                  <span className="admin-attention-mark">!</span>
                  <span><strong>{stats.pendingVerifications ?? 0}</strong> listings awaiting verification</span>
                </div>
                <Link to="/admin/listings">Review listings <span>→</span></Link>
                <span className="admin-attention-divider" />
                <div className="admin-attention-copy">
                  <span className="admin-attention-mark complaint-mark">✳</span>
                  <span><strong>{stats.openComplaints ?? 0}</strong> open customer concerns</span>
                </div>
                <Link to="/admin/complaints">View complaints <span>→</span></Link>
              </section>

              <section className="admin-dashboard-columns">
                <div className="admin-dashboard-panel admin-sales-panel">
                  <div className="admin-panel-heading">
                    <div>
                      <span className="admin-dashboard-kicker">ORDER ACTIVITY</span>
                      <h2>Sales over the last 7 days</h2>
                    </div>
                    <Link to="/admin/reports">Full reports <span>→</span></Link>
                  </div>
                  {sales.length ? (
                    <div className="admin-chart" role="img" aria-label="Daily sales for the last seven days">
                      {sales.map((day) => {
                        const revenue = Number(day.revenue) || 0;
                        const height = Math.max((revenue / maxSales) * 100, 4);
                        return (
                          <div className="admin-chart-column" key={day.date}>
                            <span className="admin-chart-value">{formatCurrency(revenue)}</span>
                            <div className="admin-chart-track">
                              <span className="admin-chart-bar" style={{ height: `${height}%` }} />
                            </div>
                            <span className="admin-chart-date">{formatDate(day.date)}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="admin-chart-empty">Sales activity will appear here when orders are placed.</div>
                  )}
                </div>

                <div className="admin-dashboard-panel admin-users-panel">
                  <div className="admin-panel-heading">
                    <div>
                      <span className="admin-dashboard-kicker">GROWING TOGETHER</span>
                      <h2>New members</h2>
                    </div>
                    <Link to="/admin/users">All users <span>→</span></Link>
                  </div>
                  {dashboard.recentUsers?.length ? (
                    <div className="admin-user-list">
                      {dashboard.recentUsers.map((member) => (
                        <div className="admin-user-row" key={member.id}>
                          <span className={`admin-user-avatar role-${member.role}`}>
                            {member.fullName?.trim()?.charAt(0)?.toUpperCase() || "R"}
                          </span>
                          <span className="admin-user-info">
                            <strong>{member.fullName}</strong>
                            <small>{member.email}</small>
                          </span>
                          <span className={`admin-role-pill role-pill-${member.role}`}>{member.role}</span>
                          <small className="admin-user-date">{formatDate(member.created_at)}</small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="admin-chart-empty">New members will appear here.</div>
                  )}
                </div>
              </section>

              <section className="admin-dashboard-panel admin-listings-panel">
                <div className="admin-panel-heading">
                  <div>
                    <span className="admin-dashboard-kicker">LATEST ON REWEAR</span>
                    <h2>Recently submitted listings</h2>
                  </div>
                  <Link to="/admin/listings">Manage listings <span>→</span></Link>
                </div>
                {dashboard.recentListings?.length ? (
                  <div className="admin-listing-table-wrap">
                    <table className="admin-listing-table">
                      <thead>
                        <tr>
                          <th>Piece</th>
                          <th>Seller</th>
                          <th>Submitted</th>
                          <th>Price</th>
                          <th>Verification</th>
                          <th>Visibility</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard.recentListings.map((listing) => (
                          <tr key={listing.id}>
                            <td><strong>{listing.name}</strong><small>{listing.brand} · {listing.category}</small></td>
                            <td>{listing.seller_name}</td>
                            <td>{formatDate(listing.created_at)}</td>
                            <td>{formatCurrency(listing.price)}</td>
                            <td><span className={`admin-verification-pill verification-${listing.verification_status}`}>{listing.verification_status}</span></td>
                            <td><span className={`admin-published-pill ${listing.is_published ? "is-published" : ""}`}>{listing.is_published ? "Published" : "Unpublished"}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="admin-chart-empty">No listings have been submitted yet.</div>
                )}
              </section>
            </>
          )
        )}
        <footer className="admin-dashboard-footer">ReWear Admin · A little care goes a long way.</footer>
      </main>
    </>
  );
}

export default AdminDashboard;
