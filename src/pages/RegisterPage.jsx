import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/RegisterPage.css";

function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
    businessRegistrationId: "",
    companyAddress: "",
    email: "",
    phone: "",
    role: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.role === "retail" && (
      !formData.companyName.trim() ||
      !formData.businessRegistrationId.trim() ||
      !formData.companyAddress.trim()
    )) {
      setError("Please complete all retail partner company details.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.role === "retail" ? formData.companyName : formData.fullName,
          companyName: formData.role === "retail" ? formData.companyName : undefined,
          businessRegistrationId: formData.role === "retail" ? formData.businessRegistrationId : undefined,
          companyAddress: formData.role === "retail" ? formData.companyAddress : undefined,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Registration Successful!");
        navigate("/");
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (error) {
      setError("Network error. Please check your connection.");
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1>Create Account</h1>
        <p>Join Clothing Resale & Exchange</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="register-role">Register As</label>
            <select
              id="register-role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select account type</option>
              <option value="customer">Customer</option>
              <option value="retail">Retail Partner</option>
            </select>
          </div>

          {formData.role === "customer" ? (
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                placeholder="Enter your name"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
          ) : formData.role === "retail" ? (
            <>
              <div className="input-group">
                <label>Retail Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  placeholder="Enter registered company name"
                  value={formData.companyName}
                  onChange={handleChange}
                  autoComplete="organization"
                  required
                />
              </div>
              <div className="input-group">
                <label>Business Registration ID</label>
                <input
                  type="text"
                  name="businessRegistrationId"
                  placeholder="Enter business registration ID"
                  value={formData.businessRegistrationId}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <label>Company Address</label>
                <input
                  type="text"
                  name="companyAddress"
                  placeholder="Enter company address"
                  value={formData.companyAddress}
                  onChange={handleChange}
                  autoComplete="street-address"
                  required
                />
              </div>
            </>
          ) : (
            <p className="register-role-prompt">Choose an account type to see the required registration details.</p>
          )}

          {formData.role && (
            <>
              <div className="input-group">
                <label>{formData.role === "retail" ? "Company Official Email" : "Email"}</label>
                <input
                  type="email"
                  name="email"
                  placeholder={formData.role === "retail" ? "Enter company email address" : "Enter email"}
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="input-group">
                <label>{formData.role === "retail" ? "Company Telephone Number" : "Phone Number"}</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder={formData.role === "retail" ? "Enter company telephone number" : "Enter phone number"}
                  value={formData.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  required
                />
              </div>

              <div className="input-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <button className="register-btn" type="submit" disabled={loading}>
                {loading ? "Registering..." : "Register"}
              </button>
            </>
          )}
        </form>

        <div className="bottom-links">
          <p>
            Already have an account?
            <Link to="/login"> Login</Link>
          </p>
          <p>
            <Link to="/"> Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;