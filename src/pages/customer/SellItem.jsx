import { API_BASE_URL } from "../../api.js";

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CustomerNavbar from "../../components/CustomerNavbar";
import "../../styles/SellItem.css";

function SellItem() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [retailPartners, setRetailPartners] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "",
    size: "",
    color: "",
    condition_status: "Like New",
    quantity: "1",
    price: "",
    original_price: "",
    description: "",
    receipt_number: "",
    order_number: "",
    image_url: "",
    retail_partner_id: ""   // NEW
  });

  const [imagePreviews, setImagePreviews] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", {
      replace: true,
      state: { message: "Your session has expired. Please log in again." }
    });
  }, [navigate]);

  const categories = ["T-Shirts","Shirts","Jeans","Trousers","Dresses","Jackets","Sweaters","Shorts","Skirts","Activewear","Traditional","Other"];
  const brands = ["NOLIMIT","Levi's","Nike","Adidas","Puma","H&M","Zara","Mango","Other"];
  const sizes = ["XS","S","M","L","XL","XXL"];
  const conditions = ["New with tags","Like New","Good","Fair"];

  // ---- NEW: fetch registered retail partners ----
  useEffect(() => {
    const fetchRetailPartners = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          handleUnauthorized();
          return;
        }
        const res = await fetch(`${API_BASE_URL}/api/customer/retail-partners`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.status === 401) {
          handleUnauthorized();
          return;
        }
        if (!res.ok) throw new Error(data.message || "Failed to load retail partners");
        setRetailPartners(data.partners || []);
      } catch (err) {
        console.error("Failed to load retail partners:", err);
        setError(err.message || "Failed to load retail partners. Please try again.");
      }
    };
    fetchRetailPartners();
  }, [handleUnauthorized]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (files.length > 5) {
      setError("You can upload up to 5 images.");
      e.target.value = "";
      setSelectedFiles([]);
      setImagePreviews([]);
      return;
    }
    if (files.some((file) => file.size > 5 * 1024 * 1024)) {
      setError("Each image must be 5 MB or smaller.");
      e.target.value = "";
      setSelectedFiles([]);
      setImagePreviews([]);
      return;
    }
    if (files.some((file) => !allowedTypes.includes(file.type))) {
      setError("Please choose JPEG, PNG, or WebP images.");
      e.target.value = "";
      setSelectedFiles([]);
      setImagePreviews([]);
      return;
    }

    setError("");
    setSelectedFiles(files);
    Promise.all(files.map((file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ file, src: reader.result });
      reader.onerror = () => reject(new Error(`Could not preview ${file.name}`));
      reader.readAsDataURL(file);
    })))
      .then(setImagePreviews)
      .catch((previewError) => {
        console.error("Image preview error:", previewError);
        setError("Could not preview the selected images.");
        setSelectedFiles([]);
        setImagePreviews([]);
      });
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Product name is required";
    if (!formData.brand) return "Brand is required";
    if (!formData.category) return "Category is required";
    if (!formData.size) return "Size is required";
    if (!Number.isInteger(Number(formData.quantity)) ||
        Number(formData.quantity) < 1 ||
        Number(formData.quantity) > 10000) {
      return "Quantity must be a whole number between 1 and 10,000";
    }
    if (!formData.retail_partner_id) return "Please select a retail partner for verification"; // NEW
    if (!formData.price || formData.price <= 0) return "Valid price is required";
    if (!formData.original_price || formData.original_price <= 0) return "Valid original price is required";
    if (parseFloat(formData.price) > parseFloat(formData.original_price)) return "Selling price cannot be higher than original price";
    if (!formData.receipt_number && !formData.order_number) return "Receipt number or order number is required";
    if (!formData.description.trim()) return "Description is required";
    if (selectedFiles.length > 5) return "You can upload up to 5 images";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        handleUnauthorized();
        return;
      }
      const listingData = new FormData();
      Object.entries({
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        size: formData.size,
        color: formData.color,
        condition_status: formData.condition_status,
        quantity: String(parseInt(formData.quantity, 10)),
        price: String(parseFloat(formData.price)),
        original_price: String(parseFloat(formData.original_price)),
        description: formData.description,
        receipt_number: formData.receipt_number,
        order_number: formData.order_number,
        retail_partner_id: formData.retail_partner_id,
        image_url: formData.image_url
      }).forEach(([key, value]) => listingData.append(key, value));
      selectedFiles.forEach((file) => listingData.append("images", file));

      const response = await fetch(`${API_BASE_URL}/api/customer/my-listings`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: listingData
      });

      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (response.ok) {
        setSuccess("Item submitted! It will be reviewed by admin and verified by the retail partner.");
        setFormData({
          name:"", brand:"", category:"", size:"", color:"",
          condition_status:"Like New", quantity:"1", price:"", original_price:"",
          description:"", receipt_number:"", order_number:"",
          image_url:"", retail_partner_id:""
        });
        setSelectedFiles([]);
        setImagePreviews([]);

      } else {
        console.error(`Listing submission failed (${response.status}):`, data.message);
        setError(data.message || "Failed to list item");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const calculatePotentialSavings = () => {
    if (formData.price && formData.original_price && parseFloat(formData.original_price) > 0) {
      return Math.round(((parseFloat(formData.original_price) - parseFloat(formData.price)) / parseFloat(formData.original_price)) * 100);
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
          <div className="info-card">
            <div className="info-icon">ℹ️</div>
            <div className="info-text">
              <h3>Before You List</h3>
              <ul>
                <li>Select the retail partner you bought the item from</li>
                <li>That partner will verify your purchase</li>
                <li>Keep your original receipt or order number handy</li>
                <li>Take clear photos and be honest about condition</li>
              </ul>
            </div>
          </div>

          {success && <div className="success-message"><span className="success-icon">✓</span><span>{success}</span></div>}
          {error && <div className="error-message"><span className="error-icon">⚠️</span><span>{error}</span></div>}

          <form onSubmit={handleSubmit} className="sell-form">
            {/* ---- NEW: Retail Partner Selection ---- */}
            <div className="form-section">
              <h2>Retail Partner</h2>
              <p className="section-description">
                Choose the registered retail partner where you purchased this item. They will verify your listing.
              </p>
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Retail Partner *</label>
                  <select
                    name="retail_partner_id"
                    value={formData.retail_partner_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Select Retail Partner --</option>
                    {retailPartners.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.fullName || p.full_name} ({p.email})
                      </option>
                    ))}
                  </select>
                  {retailPartners.length === 0 && (
                    <small className="help-text">No retail partners registered yet.</small>
                  )}
                </div>
              </div>
            </div>

            {/* ---- Item Details (unchanged) ---- */}
            <div className="form-section">
              <h2>Item Details</h2>
              <div className="form-row">
                <div className="form-group full-width">
                  <label>Item Name *</label>
                  <input type="text" name="name" placeholder="e.g., NOLIMIT Casual T-Shirt"
                    value={formData.name} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Brand *</label>
                  <select name="brand" value={formData.brand} onChange={handleChange} required>
                    <option value="">Select Brand</option>
                    {brands.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select name="category" value={formData.category} onChange={handleChange} required>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Size *</label>
                  <select name="size" value={formData.size} onChange={handleChange} required>
                    <option value="">Select Size</option>
                    {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <input type="text" name="color" placeholder="e.g., Blue, Red"
                    value={formData.color} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Condition *</label>
                  <select name="condition_status" value={formData.condition_status}
                    onChange={handleChange} required>
                    {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Available Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    max="10000"
                    step="1"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                  />
                  <small className="help-text">Number of identical items available to sell.</small>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Description *</label>
                  <textarea name="description" rows="4"
                    placeholder="Describe your item..."
                    value={formData.description} onChange={handleChange} required />
                </div>
              </div>
            </div>

            {/* ---- Pricing (unchanged) ---- */}
            <div className="form-section">
              <h2>Pricing</h2>
              <div className="form-row">
                <div className="form-group">
                  <label>Original Price (Rs.) *</label>
                  <input type="number" name="original_price" min="0" step="0.01"
                    value={formData.original_price} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Selling Price (Rs.) *</label>
                  <input type="number" name="price" min="0" step="0.01"
                    value={formData.price} onChange={handleChange} required />
                </div>
              </div>
              {formData.price && formData.original_price && (
                <div className="price-preview">
                  <div className="price-breakdown">
                    <div className="price-item"><span>Original Price:</span>
                      <span className="original">Rs. {parseFloat(formData.original_price).toLocaleString()}</span></div>
                    <div className="price-item"><span>Your Price:</span>
                      <span className="selling">Rs. {parseFloat(formData.price).toLocaleString()}</span></div>
                    <div className="price-item discount"><span>Buyer Savings:</span>
                      <span className="savings">{calculatePotentialSavings()}% OFF</span></div>
                  </div>
                </div>
              )}
            </div>

            {/* ---- Verification Details (unchanged) ---- */}
            <div className="form-section">
              <h2>Verification Details</h2>
              <p className="section-description">Provide your original purchase details</p>
              <div className="form-row">
                <div className="form-group">
                  <label>Receipt Number</label>
                  <input type="text" name="receipt_number" placeholder="e.g., REC-2024-001"
                    value={formData.receipt_number} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Order Number</label>
                  <input type="text" name="order_number" placeholder="e.g., ORD-2024-001"
                    value={formData.order_number} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* ---- Item Images ---- */}
            <div className="form-section">
              <h2>Item Images</h2>
              <p className="section-description">Upload up to 5 photos. JPEG, PNG, or WebP, up to 5 MB per image.</p>
              <div className="image-upload-area">
                {imagePreviews.length > 0 ? (
                  <div className="image-preview-grid">
                    {imagePreviews.map(({ file, src }, index) => (
                      <div className="image-preview" key={`${file.name}-${file.lastModified}`}>
                        <img src={src} alt={`Item preview ${index + 1}`} />
                        <span className="image-preview-number">{index + 1}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <span className="upload-icon">📸</span>
                    <p>Choose item photos to preview them here</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageChange}
                  className="file-input"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="upload-btn">
                  {imagePreviews.length ? "Change Photos" : "Upload Photos"}
                </label>
              </div>
              {selectedFiles.length > 0 && (
                <p className="selected-image-count">
                  {selectedFiles.length} of 5 photos selected
                </p>
              )}
              <div className="form-group">
                <label>Or enter a single image URL</label>
                <input type="url" name="image_url" placeholder="https://example.com/image.jpg"
                  value={formData.image_url} onChange={handleChange} />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn"
                onClick={() => navigate("/customer/shop")}>Cancel</button>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? <><span className="spinner"></span>Listing Item...</> : "List Item for Sale"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default SellItem;