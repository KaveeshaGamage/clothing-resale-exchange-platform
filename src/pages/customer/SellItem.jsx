import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomerNavbar from "../../components/CustomerNavbar";
import "../../styles/SellItem.css";

function SellItem() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "",
    size: "",
    color: "",
    condition_status: "Like New",
    price: "",
    original_price: "",
    description: "",
    receipt_number: "",
    order_number: "",
    image_url: ""
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const categories = [
    "T-Shirts",
    "Shirts",
    "Jeans",
    "Trousers",
    "Dresses",
    "Jackets",
    "Sweaters",
    "Shorts",
    "Skirts",
    "Activewear",
    "Traditional",
    "Other"
  ];

  const brands = [
    "NOLIMIT",
    "Levi's",
    "Nike",
    "Adidas",
    "Puma",
    "H&M",
    "Zara",
    "Mango",
    "Other"
  ];

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  
  const conditions = [
    "New with tags",
    "Like New",
    "Good",
    "Fair"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Product name is required";
    if (!formData.brand) return "Brand is required";
    if (!formData.category) return "Category is required";
    if (!formData.size) return "Size is required";
    if (!formData.condition_status) return "Condition is required";
    if (!formData.price || formData.price <= 0) return "Valid price is required";
    if (!formData.original_price || formData.original_price <= 0) return "Valid original price is required";
    if (parseFloat(formData.price) > parseFloat(formData.original_price)) return "Selling price cannot be higher than original price";
    if (!formData.receipt_number && !formData.order_number) return "Receipt number or order number is required for verification";
    if (!formData.description.trim()) return "Description is required";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      
      // If you're uploading an image, use FormData
      // For now, using JSON with image URL
      const response = await fetch("http://localhost:5000/api/customer/my-listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          brand: formData.brand,
          category: formData.category,
          size: formData.size,
          color: formData.color,
          condition_status: formData.condition_status,
          price: parseFloat(formData.price),
          original_price: parseFloat(formData.original_price),
          description: formData.description,
          receipt_number: formData.receipt_number,
          order_number: formData.order_number,
          image_url: formData.image_url || imagePreview || "https://via.placeholder.com/300x400?text=No+Image"
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Item listed successfully! It will be visible after verification.");
        
        // Reset form
        setFormData({
          name: "",
          brand: "",
          category: "",
          size: "",
          color: "",
          condition_status: "Like New",
          price: "",
          original_price: "",
          description: "",
          receipt_number: "",
          order_number: "",
          image_url: ""
        });
        setImagePreview(null);
        setSelectedFile(null);

        // Redirect to My Listings after 2 seconds
        setTimeout(() => {
          navigate("/customer/dashboard/my-listings");
        }, 2000);
      } else {
        setError(data.message || "Failed to list item");
      }
    } catch (error) {
      console.error("Error listing item:", error);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const calculatePotentialSavings = () => {
    if (formData.price && formData.original_price && parseFloat(formData.original_price) > 0) {
      const discount = ((parseFloat(formData.original_price) - parseFloat(formData.price)) / parseFloat(formData.original_price) * 100);
      return Math.round(discount);
    }
    return 0;
  };

  return (
    <>
        <CustomerNavbar />
    <div className="sell-item-page">
      <div className="sell-header">
        <h1>Sell Your Item</h1>
        <p>List your unused clothing items for resale</p>
      </div>

      <div className="sell-content">
        {/* Info Card */}
        <div className="info-card">
          <div className="info-icon">ℹ️</div>
          <div className="info-text">
            <h3>Before You List</h3>
            <ul>
              <li>Items must be purchased from partner stores (e.g., NOLIMIT)</li>
              <li>Keep your original receipt or order number handy</li>
              <li>Take clear photos of your item</li>
              <li>Be honest about the condition</li>
              <li>Items will be verified by the retailer before listing</li>
            </ul>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="success-message">
            <span className="success-icon">✓</span>
            <span>{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Sell Form */}
        <form onSubmit={handleSubmit} className="sell-form">
          <div className="form-section">
            <h2>Item Details</h2>
            
            <div className="form-row">
              <div className="form-group full-width">
                <label>Item Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g., NOLIMIT Casual T-Shirt"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Brand *</label>
                <select name="brand" value={formData.brand} onChange={handleChange} required>
                  <option value="">Select Brand</option>
                  {brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select name="category" value={formData.category} onChange={handleChange} required>
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Size *</label>
                <select name="size" value={formData.size} onChange={handleChange} required>
                  <option value="">Select Size</option>
                  {sizes.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Color</label>
                <input
                  type="text"
                  name="color"
                  placeholder="e.g., Blue, Red"
                  value={formData.color}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Condition *</label>
                <select name="condition_status" value={formData.condition_status} onChange={handleChange} required>
                  {conditions.map(cond => (
                    <option key={cond} value={cond}>{cond}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  placeholder="Describe your item (condition, how many times worn, any defects, etc.)"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Pricing</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label>Original Price (Rs.) *</label>
                <input
                  type="number"
                  name="original_price"
                  placeholder="e.g., 2490"
                  value={formData.original_price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                />
                <small className="help-text">Price you paid when purchased</small>
              </div>

              <div className="form-group">
                <label>Selling Price (Rs.) *</label>
                <input
                  type="number"
                  name="price"
                  placeholder="e.g., 1200"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                />
                <small className="help-text">Price you want to sell for</small>
              </div>
            </div>

            {formData.price && formData.original_price && (
              <div className="price-preview">
                <div className="price-breakdown">
                  <div className="price-item">
                    <span>Original Price:</span>
                    <span className="original">Rs. {parseFloat(formData.original_price).toLocaleString()}</span>
                  </div>
                  <div className="price-item">
                    <span>Your Price:</span>
                    <span className="selling">Rs. {parseFloat(formData.price).toLocaleString()}</span>
                  </div>
                  <div className="price-item discount">
                    <span>Buyer Savings:</span>
                    <span className="savings">{calculatePotentialSavings()}% OFF</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="form-section">
            <h2>Verification Details</h2>
            <p className="section-description">
              Provide your original purchase details for verification by the retailer
            </p>

            <div className="form-row">
              <div className="form-group">
                <label>Receipt Number</label>
                <input
                  type="text"
                  name="receipt_number"
                  placeholder="e.g., REC-2024-001"
                  value={formData.receipt_number}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Order Number</label>
                <input
                  type="text"
                  name="order_number"
                  placeholder="e.g., ORD-2024-001"
                  value={formData.order_number}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Item Image</h2>
            
            <div className="image-upload-area">
              {imagePreview ? (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button 
                    type="button" 
                    className="remove-image-btn"
                    onClick={() => {
                      setImagePreview(null);
                      setSelectedFile(null);
                    }}
                  >
                    ✕ Remove
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <span className="upload-icon">📸</span>
                  <p>Click to upload item photo</p>
                  <p className="upload-hint">or drag and drop</p>
                </div>
              )}
              
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="upload-btn">
                {imagePreview ? "Change Photo" : "Upload Photo"}
              </label>
            </div>

            <div className="form-group">
              <label>Or enter image URL</label>
              <input
                type="url"
                name="image_url"
                placeholder="https://example.com/image.jpg"
                value={formData.image_url}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => navigate("/customer/shop")}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Listing Item...
                </>
              ) : (
                "List Item for Sale"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}

export default SellItem;