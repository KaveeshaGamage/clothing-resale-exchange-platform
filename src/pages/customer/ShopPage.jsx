import { API_BASE_URL } from "../../api.js";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CustomerNavbar from "../../components/CustomerNavbar";
import ProductImage from "../../components/ProductImage";
import "../../styles/ShopPage.css";

function ShopPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    brand: "",
    size: "",
    condition: "",
    priceMin: "",
    priceMax: "",
    sortBy: "newest"
  });

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  
  const sizes = ["All", "XS", "S", "M", "L", "XL", "XXL"];
  const conditions = ["All", "New with tags", "Like New", "Good", "Fair"];
  
  // Define priceRanges here
  const priceRanges = [
    { label: "All Prices", min: "", max: "" },
    { label: "Under Rs. 1,000", min: "0", max: "1000" },
    { label: "Rs. 1,000 - Rs. 2,500", min: "1000", max: "2500" },
    { label: "Rs. 2,500 - Rs. 5,000", min: "2500", max: "5000" },
    { label: "Rs. 5,000 - Rs. 10,000", min: "5000", max: "10000" },
    { label: "Above Rs. 10,000", min: "10000", max: "" }
  ];

  useEffect(() => {
    fetchFilterOptions();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchFilterOptions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/products/filter-options`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
        setBrands(data.brands || []);
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      
      if (filters.search) params.append("search", filters.search);
      if (filters.category && filters.category !== "All") params.append("category", filters.category);
      if (filters.brand && filters.brand !== "All") params.append("brand", filters.brand);
      if (filters.size && filters.size !== "All") params.append("size", filters.size);
      if (filters.condition && filters.condition !== "All") params.append("condition", filters.condition);
      if (filters.priceMin) params.append("priceMin", filters.priceMin);
      if (filters.priceMax) params.append("priceMax", filters.priceMax);
      if (filters.sortBy) params.append("sortBy", filters.sortBy);

      const queryString = params.toString();
      const url = `${API_BASE_URL}/api/products/available${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePriceRangeChange = (e) => {
    const selectedRange = priceRanges.find(range => range.label === e.target.value);
    if (selectedRange) {
      setFilters(prev => ({
        ...prev,
        priceMin: selectedRange.min,
        priceMax: selectedRange.max
      }));
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleAddToCart = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: productId, quantity: 1 })
      });

      if (response.ok) {
        alert("Item added to cart!");
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Could not connect to the server. Please try adding the item again.");
    }
  };

  const handleAddToWishlist = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/favorites/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: productId }),
      });
      const data = await response.json();

      if (response.ok) {
        alert(data.message || "Item added to wishlist!");
      } else {
        alert(data.message || "Failed to add item to wishlist");
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      alert("Could not connect to the server. Please try adding the item again.");
    }
  };

  const calculateDiscount = (originalPrice, price) => {
    if (!originalPrice || !price || originalPrice === 0) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  if (loading) {
    return (
      <>
        <CustomerNavbar />
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading products...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <CustomerNavbar />
      <div className="shop-page">
        <div className="shop-header">
          <h1>Shop Clothes</h1>
          <p>Find great deals on verified pre-owned clothing</p>
        </div>

        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}

        {/* Filters Section */}
        <div className="filters-section">
          <form onSubmit={handleSearchSubmit} className="search-bar">
            <input
              type="text"
              name="search"
              placeholder="Search by name, brand, or category..."
              value={filters.search}
              onChange={handleFilterChange}
            />
            <button type="submit" className="search-btn">🔍</button>
          </form>

          <div className="filter-controls">
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select name="brand" value={filters.brand} onChange={handleFilterChange}>
              <option value="">All Brands</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>

            <select name="size" value={filters.size} onChange={handleFilterChange}>
              <option value="">All Sizes</option>
              {sizes.map(size => (
                <option key={size} value={size === "All" ? "" : size}>{size}</option>
              ))}
            </select>

            <select name="condition" value={filters.condition} onChange={handleFilterChange}>
              <option value="">All Conditions</option>
              {conditions.map(cond => (
                <option key={cond} value={cond === "All" ? "" : cond}>{cond}</option>
              ))}
            </select>

            <select onChange={handlePriceRangeChange}>
              {priceRanges.map(range => (
                <option key={range.label} value={range.label}>{range.label}</option>
              ))}
            </select>

            <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="products-grid">
          {products.length === 0 ? (
            <div className="no-products">
              <span className="empty-icon">🛍️</span>
              <h3>No products found</h3>
              <p>Try adjusting your filters or check back later for new items</p>
            </div>
          ) : (
            products.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  <ProductImage
                    src={product.image_url}
                    alt={product.name} 
                  />
                  {product.verification_status === "verified" && (
                    <span className="verified-badge">✓ Verified</span>
                  )}
                  {product.original_price > product.price && (
                    <div className="discount-badge">
                      -{calculateDiscount(product.original_price, product.price)}%
                    </div>
                  )}
                </div>

                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="brand">{product.brand}</p>
                  
                  <div className="product-details">
                    <span className="detail">Size: {product.size}</span>
                    {product.color && <span className="detail">Color: {product.color}</span>}
                    <span className="detail">Condition: {product.condition_status}</span>
                  </div>

                  <div className="price-section">
                    <span className="current-price">Rs. {parseFloat(product.price).toLocaleString()}</span>
                    <span className="original-price">Rs. {parseFloat(product.original_price).toLocaleString()}</span>
                  </div>

                  <div className="seller-info">
                    <span>Seller: {product.seller_name}</span>
                  </div>

                  <div className="product-actions">
                    <button 
                      className="add-to-cart-btn"
                      onClick={() => handleAddToCart(product.id)}
                    >
                      Add to Cart
                    </button>
                  </div>
                  <button
                    className="add-to-wishlist-btn"
                    onClick={() => handleAddToWishlist(product.id)}
                  >
                    <span aria-hidden="true">♡</span> Add to Wishlist
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default ShopPage;