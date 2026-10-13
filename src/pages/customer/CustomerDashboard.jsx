import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CustomerNavbar from "../../components/CustomerNavbar.jsx";
import ProductImage from "../../components/ProductImage.jsx";
import { API_BASE_URL } from "../../api.js";
import "../../styles/CustomerDashboard.css";

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
    : "Recently";

function CustomerDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState({});

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Your session has ended. Please log in to view your dashboard.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/customer/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            "This API server does not have the customer dashboard route yet. Restart the backend from the backend folder with `npm run dev`."
          );
        }
        throw new Error(data.message || "Unable to load your dashboard.");
      }
      setDashboard(data);
      try {
        setUser(JSON.parse(localStorage.getItem("user") || "{}"));
      } catch {
        setUser({});
      }
    } catch (loadError) {
      if (!loadError.message.includes("does not have the customer dashboard route")) {
        console.error("Customer dashboard request failed:", loadError);
      }
      setError(loadError.message || "Unable to reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    const refreshTimer = window.setInterval(loadDashboard, 20000);
    return () => window.clearInterval(refreshTimer);
  }, [loadDashboard]);

  const stats = dashboard?.stats || {};

  return (
    <>
      <CustomerNavbar />
      <main className="customer-dashboard">
        <section className="customer-dashboard-heading">
          <div>
            <span className="customer-dashboard-kicker">YOUR REWEAR SPACE</span>
            <h1>
              Good to see you, {user.fullName?.split(" ")[0] || "there"}.
            </h1>
            <p>Pick up where you left off or find something new to love.</p>
          </div>
          <Link className="customer-dashboard-primary" to="/customer/shop">
            Explore the shop <span aria-hidden="true">↗</span>
          </Link>
        </section>

        {error && (
          <div className="dashboard-state dashboard-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={loadDashboard}>
              Try again
            </button>
            {!localStorage.getItem("token") && (
              <Link to="/login">Go to login</Link>
            )}
          </div>
        )}

        {loading ? (
          <div className="dashboard-state" role="status">
            Loading your dashboard…
          </div>
        ) : (
          dashboard && (
            <>
              <section className="customer-stat-grid" aria-label="Your activity">
                <article className="customer-stat-card">
                  <span className="customer-stat-icon sage">↗</span>
                  <span className="customer-stat-label">My orders</span>
                  <strong>{stats.orderCount ?? 0}</strong>
                  <Link to="/customer/orders">View order history</Link>
                </article>
                <article className="customer-stat-card">
                  <span className="customer-stat-icon peach">♧</span>
                  <span className="customer-stat-label">My listings</span>
                  <strong>{stats.listingCount ?? 0}</strong>
                  <Link to="/customer/my-listings">Manage listings</Link>
                </article>
                <article className="customer-stat-card">
                  <span className="customer-stat-icon lavender">♡</span>
                  <span className="customer-stat-label">Saved pieces</span>
                  <strong>{stats.savedCount ?? 0}</strong>
                  <Link to="/customer/wishlist">Open wishlist</Link>
                </article>
                <article className="customer-stat-card">
                  <span className="customer-stat-icon butter">▣</span>
                  <span className="customer-stat-label">In your cart</span>
                  <strong>{stats.cartCount ?? 0}</strong>
                  <Link to="/customer/cart">Review cart</Link>
                </article>
              </section>

              <section className="customer-dashboard-columns">
                <div className="customer-dashboard-panel customer-orders-panel">
                  <div className="customer-panel-heading">
                    <div>
                      <span className="customer-dashboard-kicker">KEEP TRACK</span>
                      <h2>Recent orders</h2>
                    </div>
                    <Link to="/customer/orders">All orders <span>→</span></Link>
                  </div>
                  {dashboard.recentOrders?.length ? (
                    <div className="customer-order-list">
                      {dashboard.recentOrders.map((order) => (
                        <Link
                          className="customer-order-row"
                          to={`/customer/order-details/${order.id}`}
                          key={order.id}
                        >
                          <span className="customer-order-icon">R</span>
                          <span className="customer-order-description">
                            <strong>Order #{order.id}</strong>
                            <small>
                              {Number(order.items_count) || 0}{" "}
                              {Number(order.items_count) === 1 ? "item" : "items"} ·{" "}
                              {formatDate(order.order_date)}
                            </small>
                          </span>
                          <span
                            className={`customer-order-status status-${order.delivery_status || order.order_status}`}
                          >
                            {(order.delivery_status || order.order_status || "unknown")
                              .split("_")
                              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                              .join(" ")}
                          </span>
                          <strong className="customer-order-total">
                            {formatCurrency(order.total_amount)}
                          </strong>
                          <span className="customer-row-arrow" aria-hidden="true">
                            →
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="customer-empty-state">
                      <span>✳</span>
                      <strong>Your next great find is waiting.</strong>
                      <p>Your orders will show up here after checkout.</p>
                      <Link to="/customer/shop">Browse the shop</Link>
                    </div>
                  )}
                </div>

                <aside className="customer-dashboard-panel customer-spend-panel">
                  <span className="customer-dashboard-kicker">YOUR IMPACT</span>
                  <h2>Thoughtful finds, happy totals.</h2>
                  <p>
                    Your shopping adds up to
                    <strong> {formatCurrency(stats.totalSpend)}</strong>.
                  </p>
                  <div className="customer-impact-mark" aria-hidden="true">
                    <span>R</span>
                  </div>
                  <Link to="/customer/shop" className="customer-impact-link">
                    Find another favourite <span>↗</span>
                  </Link>
                </aside>
              </section>

              <section className="customer-dashboard-panel customer-arrivals-panel">
                <div className="customer-panel-heading">
                  <div>
                    <span className="customer-dashboard-kicker">JUST ADDED</span>
                    <h2>Fresh finds for you</h2>
                  </div>
                  <Link to="/customer/shop">Shop all <span>→</span></Link>
                </div>
                {dashboard.newArrivals?.length ? (
                  <div className="customer-arrivals-grid">
                    {dashboard.newArrivals.map((product) => (
                      <Link
                        to="/customer/shop"
                        className="customer-arrival-card"
                        key={product.id}
                      >
                        {product.image_url ? (
                          <ProductImage
                            src={product.image_url}
                            alt={product.name}
                            loading="lazy"
                          />
                        ) : (
                          <div className="customer-arrival-placeholder">
                            <span>REWEAR FIND</span>
                          </div>
                        )}
                        <span className="customer-arrival-category">
                          {product.category}
                        </span>
                        <strong>{product.name}</strong>
                        <span className="customer-arrival-meta">
                          {product.brand} · {product.size}
                        </span>
                        <span className="customer-arrival-price">
                          {formatCurrency(product.price)}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="customer-arrivals-empty">
                    No new arrivals right now. Check back soon for new finds.
                  </div>
                )}
              </section>
            </>
          )
        )}

        <footer className="customer-dashboard-footer">
          ReWear · Good clothes deserve another story.
        </footer>
      </main>
    </>
  );
}

export default CustomerDashboard;
