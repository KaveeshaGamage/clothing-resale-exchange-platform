import { API_BASE_URL } from "../../api.js";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Wishlist.css";
import CustomerNavbar from "../../components/CustomerNavbar";
import ProductImage from "../../components/ProductImage";

const Wishlist = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/favorites`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load wishlist"
        );
      }

      setFavorites(data.favorites || []);
    } catch (error) {
      console.error("Wishlist error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const removeFavorite = async (favoriteId) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/favorites/remove/${favoriteId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove item");
      }

      setFavorites((prev) =>
        prev.filter((item) => item.id !== favoriteId)
      );
    } catch (error) {
      console.error("Remove wishlist error:", error);
    }
  };

  if (loading) {
    return (
      <>
        <CustomerNavbar />

        <div className="wishlist-loading">
          <div>
            <div className="wishlist-spinner"></div>
            <p>Loading wishlist...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <CustomerNavbar />

      <div className="wishlist-page">
        <div className="wishlist-container">

          {/* Page Header */}
          <h1 className="wishlist-title">
            ❤️ My Wishlist
          </h1>

          {favorites.length === 0 ? (
            /* Empty Wishlist */
            <div className="wishlist-empty">

              <div className="wishlist-empty-icon">
                ❤️
              </div>

              <h2>
                Your wishlist is empty
              </h2>

              <p>
                Save products you like and find them here later.
              </p>

              <button
                onClick={() => navigate("/customer/shop")}
                className="wishlist-browse-button"
              >
                Browse Products
              </button>

            </div>
          ) : (
            /* Wishlist Products */
            <div className="wishlist-grid">

              {favorites.map((item) => (
                <div
                  key={item.id}
                  className="wishlist-card"
                >

                  <ProductImage
                    src={item.image_url}
                    alt={item.name}
                    className="wishlist-image"
                  />

                  <div className="wishlist-content">

                    <h2 className="wishlist-product-name">
                      {item.name}
                    </h2>

                    <p className="wishlist-brand">
                      {item.brand}
                    </p>

                    <p className="wishlist-details">
                      {item.category} • Size {item.size}
                    </p>

                    <div className="wishlist-bottom">

                      <span className="wishlist-price">
                        Rs.{" "}
                        {Number(item.price).toLocaleString()}
                      </span>

                      <button
                        onClick={() =>
                          removeFavorite(item.id)
                        }
                        className="wishlist-remove"
                      >
                        Remove ❤️
                      </button>

                    </div>

                  </div>
                </div>
              ))}

            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Wishlist;