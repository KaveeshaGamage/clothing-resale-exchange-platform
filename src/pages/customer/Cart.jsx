import { API_BASE_URL } from "../../api.js";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CustomerNavbar from "../../components/CustomerNavbar.jsx";
import ProductImage from "../../components/ProductImage.jsx";
import "../../styles/Cart.css";

function Cart() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [quantityDrafts, setQuantityDrafts] = useState({});
  const [updatingQuantities, setUpdatingQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");
  const [placing, setPlacing] = useState(false);

  // =====================================================
  // FETCH CART
  // =====================================================
  const fetchCart = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login to view your cart.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/cart`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setItems(data.items || []);
        setQuantityDrafts(
          Object.fromEntries((data.items || []).map((item) => [item.id, String(item.quantity)]))
        );
        setError("");
      } else {
        setError(data.message || "Failed to load cart");
      }
    } catch (err) {
      console.error("Fetch cart error:", err);
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // Load cart when page opens
  useEffect(() => {
    fetchCart();
  }, []);

  // =====================================================
  // UPDATE QUANTITY
  // =====================================================
  const updateQuantity = async (cartId, newQty) => {
    const requestedQuantity = Number(newQty);
    const item = items.find((cartItem) => cartItem.id === cartId);
    if (!item || !Number.isInteger(requestedQuantity) ||
        requestedQuantity < 1 || requestedQuantity > Number(item.stock_quantity)) {
      setQuantityDrafts((prev) => ({
        ...prev,
        [cartId]: String(item?.quantity || 1)
      }));
      setError(item
        ? `Choose a whole number from 1 to ${item.stock_quantity} for ${item.name}.`
        : "This cart item is no longer available.");
      return;
    }

    setUpdatingQuantities((prev) => ({ ...prev, [cartId]: true }));
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API_BASE_URL}/api/cart/update/${cartId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            quantity: newQty,
          }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === cartId
              ? { ...item, quantity: requestedQuantity }
              : item
          )
        );
        setQuantityDrafts((prev) => ({
          ...prev,
          [cartId]: String(requestedQuantity)
        }));
        setError("");
      } else {
        setError(data.message || "Failed to update quantity");
        setQuantityDrafts((prev) => ({
          ...prev,
          [cartId]: String(item.quantity)
        }));
      }
    } catch (err) {
      console.error("Update quantity error:", err);
      setError("Failed to update quantity. Please try again.");
      setQuantityDrafts((prev) => ({
        ...prev,
        [cartId]: String(item.quantity)
      }));
    } finally {
      setUpdatingQuantities((prev) => ({ ...prev, [cartId]: false }));
    }
  };

  // =====================================================
  // REMOVE ITEM
  // =====================================================
  const removeItem = async (cartId) => {
    if (!window.confirm("Remove this item from your cart?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API_BASE_URL}/api/cart/remove/${cartId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        setItems((prev) =>
          prev.filter((item) => item.id !== cartId)
        );
      } else {
        alert(data.message || "Failed to remove item");
      }
    } catch (err) {
      console.error("Remove item error:", err);
      alert("Failed to remove item.");
    }
  };

  // =====================================================
  // CLEAR CART
  // =====================================================
  const clearCart = async () => {
    if (!window.confirm("Clear your entire cart?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API_BASE_URL}/api/cart/clear`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (res.ok) {
        setItems([]);
      } else {
        alert(data.message || "Failed to clear cart");
      }
    } catch (err) {
      console.error("Clear cart error:", err);
      alert("Failed to clear cart.");
    }
  };

  // =====================================================
  // CHECKOUT
  // =====================================================
  const handleCheckout = async () => {
    if (!shippingAddress.trim()) {
      alert("Please enter a shipping address");
      return;
    }

    setPlacing(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API_BASE_URL}/api/cart/checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            shipping_address: shippingAddress,
            payment_method: paymentMethod,
          }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        alert(`Order placed! Order #${data.order_id}`);

        setItems([]);
        setShowCheckout(false);
        setShippingAddress("");

        navigate("/customer/orders");
      } else {
        console.error("Checkout request failed:", {
          status: res.status,
          message: data.message,
          errorCode: data.error_code
        });
        alert(data.message || "Checkout failed");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Network error during checkout.");
    } finally {
      setPlacing(false);
    }
  };

  // =====================================================
  // CALCULATE TOTALS
  // =====================================================

  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 0;

    return sum + price * quantity;
  }, 0);

  const totalItems = items.reduce((sum, item) => {
    return sum + (parseInt(item.quantity) || 0);
  }, 0);

  const totalSavings = items.reduce((sum, item) => {
    const originalPrice = parseFloat(item.original_price) || 0;
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 0;

    return sum + (originalPrice - price) * quantity;
  }, 0);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <>
        <CustomerNavbar />

        <div className="loading">
          <div className="spinner"></div>
          <p>Loading your cart...</p>
        </div>
      </>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <>
      <CustomerNavbar />

      <div className="cart-page">

        {/* =================================================
            HEADER
        ================================================== */}
        <div className="cart-header">
          <h1>🛒 My Cart</h1>

          <p>
            {totalItems} item
            {totalItems !== 1 ? "s" : ""} in your cart
          </p>
        </div>

        {/* =================================================
            ERROR
        ================================================== */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* =================================================
            EMPTY CART
        ================================================== */}
        {items.length === 0 ? (
          <div className="empty-cart">

            <span className="empty-icon">
              🛒
            </span>

            <h3>Your cart is empty</h3>

            <p>
              Add some items to get started.
            </p>

            <button
              type="button"
              onClick={() => navigate("/customer/shop")}
            >
              Browse Shop
            </button>

          </div>
        ) : (

          /* =================================================
             CART WITH ITEMS
          ================================================== */

          <div className="cart-layout">

            {/* =================================================
                LEFT - CART ITEMS
            ================================================== */}

            <div className="cart-items">

              {items.map((item) => (

                <div
                  key={item.id}
                  className="cart-item"
                >

                  {/* PRODUCT IMAGE */}
                  <ProductImage
                    src={item.image_url}
                    alt={item.name}
                    className="cart-item-image"
                  />

                  {/* PRODUCT INFORMATION */}
                  <div className="cart-item-info">

                    <h3>
                      {item.name}
                    </h3>

                    <p className="cart-item-brand">
                      {item.brand}
                    </p>

                    <div className="cart-item-details">

                      <span>
                        Size: {item.size}
                      </span>

                      {item.color && (
                        <span>
                          Color: {item.color}
                        </span>
                      )}

                      <span>
                        Condition: {item.condition_status}
                      </span>

                    </div>

                    <p className="cart-item-seller">
                      Seller: {item.seller_name}
                    </p>

                    {/* PRICE */}
                    <div className="cart-item-prices">

                      <span className="price-now">
                        Rs.{" "}
                        {(
                          parseFloat(item.price) || 0
                        ).toLocaleString()}
                      </span>

                      {parseFloat(item.original_price) > 0 && (
                        <span className="price-old">
                          Rs.{" "}
                          {(
                            parseFloat(item.original_price) || 0
                          ).toLocaleString()}
                        </span>
                      )}

                    </div>

                  </div>

                  {/* =================================================
                      QUANTITY / SUBTOTAL / REMOVE
                  ================================================== */}

                  <div className="cart-item-controls">

                    {/* QUANTITY */}
                    <div className="qty-control">

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity - 1
                          )
                        }
                        disabled={item.quantity <= 1 || updatingQuantities[item.id]}
                      >
                        −
                      </button>

                      <input
                        type="number"
                        min="1"
                        max={item.stock_quantity}
                        step="1"
                        inputMode="numeric"
                        aria-label={`Quantity for ${item.name}`}
                        value={quantityDrafts[item.id] ?? String(item.quantity)}
                        disabled={updatingQuantities[item.id]}
                        onChange={(event) => {
                          setQuantityDrafts((prev) => ({
                            ...prev,
                            [item.id]: event.target.value
                          }));
                        }}
                        onBlur={(event) => {
                          const value = event.currentTarget.value;
                          if (value !== String(item.quantity)) {
                            updateQuantity(item.id, value);
                          }
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.currentTarget.blur();
                          }
                        }}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            item.quantity + 1
                          )
                        }
                        disabled={item.quantity >= item.stock_quantity || updatingQuantities[item.id]}
                        aria-label={`Increase quantity for ${item.name}`}
                      >
                        +
                      </button>

                    </div>
                    <small className="cart-stock-note">
                      {item.stock_quantity} available
                    </small>

                    {/* SUBTOTAL */}
                    <p className="cart-item-subtotal">
                      Subtotal: Rs.{" "}
                      {(
                        (parseFloat(item.price) || 0) *
                        (parseInt(item.quantity) || 0)
                      ).toLocaleString()}
                    </p>

                    {/* REMOVE */}
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() =>
                        removeItem(item.id)
                      }
                    >
                      🗑️ Remove
                    </button>

                  </div>

                </div>

              ))}

              {/* CLEAR CART */}
              <button
                type="button"
                className="clear-cart-btn"
                onClick={clearCart}
              >
                Clear Cart
              </button>

            </div>

            {/* =================================================
                RIGHT - ORDER SUMMARY
            ================================================== */}

            <aside className="cart-summary">

              <h2>
                Order Summary
              </h2>

              <div className="summary-row">

                <span>
                  Items ({totalItems})
                </span>

                <span>
                  Rs. {subtotal.toLocaleString()}
                </span>

              </div>

              <div className="summary-row savings">

                <span>
                  You Save
                </span>

                <span>
                  Rs. {totalSavings.toLocaleString()}
                </span>

              </div>

              <div className="summary-row">

                <span>
                  Shipping
                </span>

                <span>
                  Free
                </span>

              </div>

              <div className="summary-row total">

                <span>
                  Total
                </span>

                <span>
                  Rs. {subtotal.toLocaleString()}
                </span>

              </div>

              {/* CHECKOUT */}
              <button
                type="button"
                className="checkout-btn"
                onClick={() =>
                  setShowCheckout(true)
                }
              >
                Proceed to Checkout →
              </button>

              {/* CONTINUE SHOPPING */}
              <button
                type="button"
                className="continue-btn"
                onClick={() =>
                  navigate("/customer/shop")
                }
              >
                Continue Shopping
              </button>

            </aside>

          </div>
        )}

        {/* =================================================
            CHECKOUT MODAL
        ================================================== */}

        {showCheckout && (

          <div className="modal-overlay">

            <div className="checkout-modal">

              {/* MODAL HEADER */}
              <div className="modal-header">

                <h2>
                  Checkout
                </h2>

                <button
                  type="button"
                  className="close-btn"
                  onClick={() =>
                    setShowCheckout(false)
                  }
                >
                  ✕
                </button>

              </div>

              {/* MODAL BODY */}
              <div className="modal-body">

                {/* SHIPPING ADDRESS */}
                <label>
                  Shipping Address *
                </label>

                <textarea
                  rows="4"
                  placeholder="Enter your full delivery address..."
                  value={shippingAddress}
                  onChange={(e) =>
                    setShippingAddress(
                      e.target.value
                    )
                  }
                />

                {/* PAYMENT METHOD */}
                <label>
                  Payment Method
                </label>

                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(
                      e.target.value
                    )
                  }
                >
                  <option value="cash_on_delivery">
                    Cash on Delivery
                  </option>

                  <option value="card">
                    Card Payment
                  </option>
                </select>

                {/* TOTAL */}
                <div className="checkout-total">

                  <strong>
                    Total: Rs.{" "}
                    {subtotal.toLocaleString()}
                  </strong>

                </div>

              </div>

              {/* MODAL FOOTER */}
              <div className="modal-footer">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() =>
                    setShowCheckout(false)
                  }
                >
                  Cancel
                </button>

                <button
  type="button"
  className="confirm-btn"
  onClick={handleCheckout}
  disabled={placing}
>
  {placing ? "Placing Order..." : "Place Order"}
</button>

              </div>

            </div>

          </div>

        )}

      </div>
    </>
  );
}

export default Cart;
