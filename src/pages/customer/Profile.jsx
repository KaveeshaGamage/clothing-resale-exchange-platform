import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Profile.css";
import CustomerNavbar from "../../components/CustomerNavbar";
const Profile = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);

        setUser(parsedUser);

        setFormData({
          fullName: parsedUser.fullName || "",
          email: parsedUser.email || "",
          phone: parsedUser.phone || "",
        });
      } catch (error) {
        console.error("Unable to load user:", error);
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  /* ================================
     HANDLE INPUT
  ================================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ================================
     SAVE PROFILE
  ================================= */

  const handleSave = () => {
    const updatedUser = {
      ...user,
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
    };

    localStorage.setItem("user", JSON.stringify(updatedUser));

    setUser(updatedUser);
    setIsEditing(false);

    alert("Profile updated successfully!");
  };

  /* ================================
     CANCEL EDIT
  ================================= */

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });

    setIsEditing(false);
  };

  /* ================================
     LOGOUT
  ================================= */

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  /* ================================
     INITIALS
  ================================= */

  const getInitials = (name) => {
    if (!name) return "U";

    const words = name.trim().split(" ");

    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }

    return (
      words[0].charAt(0) +
      words[words.length - 1].charAt(0)
    ).toUpperCase();
  };

  /* ================================
     FORMAT ROLE
  ================================= */

  const formatRole = (role) => {
    if (!role) return "Customer";

    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  /* ================================
     FORMAT DATE
  ================================= */

  const formatDate = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  if (!user) {
    return (
      <div className="profile-loading-page">
        <div className="profile-loader"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <>
      <CustomerNavbar />
    <div className="profile-page">

      {/* =================================
          PAGE HEADER
      ================================== */}

      <div className="profile-container">

        <div className="profile-header">

          <div>
            <div className="profile-breadcrumb">
              Account <span>/</span> Profile
            </div>

            <h1>My Profile</h1>

            <p>
              Manage your account information and preferences
            </p>
          </div>

          <button
            className="profile-back-btn"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>

        </div>


        {/* =================================
            PROFILE HERO
        ================================== */}

        <div className="profile-hero">

          <div className="profile-hero-left">

            <div className="profile-avatar-large">
              {getInitials(user.fullName)}
            </div>

            <div className="profile-hero-info">

              <h2>{user.fullName || "User"}</h2>

              <div className="profile-user-role">
                <span className="role-dot"></span>
                {formatRole(user.role)}
              </div>

              <p>
                {user.email || "No email available"}
              </p>

            </div>

          </div>

          {!isEditing && (
            <button
              className="hero-edit-btn"
              onClick={() => setIsEditing(true)}
            >
              <span>✎</span>
              Edit Profile
            </button>
          )}

        </div>


        {/* =================================
            MAIN CONTENT
        ================================== */}

        <div className="profile-content-grid">

          {/* =================================
              PERSONAL INFORMATION
          ================================== */}

          <div className="profile-card personal-card">

            <div className="card-title-section">

              <div className="card-title-icon">
                👤
              </div>

              <div>
                <h2>Personal Information</h2>
                <p>
                  Your personal account details
                </p>
              </div>

            </div>


            <div className="profile-form">

              {/* FULL NAME */}

              <div className="profile-field">

                <label>Full Name</label>

                {isEditing ? (
                  <div className="input-wrapper">
                    <span>👤</span>

                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                    />
                  </div>
                ) : (
                  <div className="profile-value">
                    {user.fullName || "Not available"}
                  </div>
                )}

              </div>


              {/* EMAIL */}

              <div className="profile-field">

                <label>Email Address</label>

                {isEditing ? (
                  <div className="input-wrapper">
                    <span>✉</span>

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                    />
                  </div>
                ) : (
                  <div className="profile-value">
                    {user.email || "Not available"}
                  </div>
                )}

              </div>


              {/* PHONE */}

              <div className="profile-field">

                <label>Phone Number</label>

                {isEditing ? (
                  <div className="input-wrapper">
                    <span>☎</span>

                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                    />
                  </div>
                ) : (
                  <div className="profile-value">
                    {user.phone || "Not available"}
                  </div>
                )}

              </div>


              {/* ROLE */}

              <div className="profile-field">

                <label>Account Type</label>

                <div className="profile-value role-value">

                  <span className="small-role-dot"></span>

                  {formatRole(user.role)}

                </div>

              </div>

            </div>


            {/* EDIT ACTIONS */}

            {isEditing && (

              <div className="profile-actions">

                <button
                  className="cancel-btn"
                  onClick={handleCancel}
                >
                  Cancel
                </button>

                <button
                  className="save-btn"
                  onClick={handleSave}
                >
                  ✓ Save Changes
                </button>

              </div>

            )}

          </div>


          {/* =================================
              ACCOUNT INFORMATION
          ================================== */}

          <div className="profile-card account-card">

            <div className="card-title-section">

              <div className="card-title-icon">
                ⚙
              </div>

              <div>
                <h2>Account Information</h2>
                <p>
                  Your ReWear account details
                </p>
              </div>

            </div>


            <div className="account-info-list">

              {/* USER ID */}

              <div className="account-info-row">

                <div className="account-info-icon">
                  #
                </div>

                <div>
                  <span>User ID</span>
                  <strong>
                    #{user.id || "N/A"}
                  </strong>
                </div>

              </div>


              {/* MEMBER SINCE */}

              <div className="account-info-row">

                <div className="account-info-icon">
                  📅
                </div>

                <div>
                  <span>Member Since</span>
                  <strong>
                    {formatDate(user.created_at)}
                  </strong>
                </div>

              </div>


              {/* ACCOUNT TYPE */}

              <div className="account-info-row">

                <div className="account-info-icon">
                  ♙
                </div>

                <div>
                  <span>Account Type</span>
                  <strong>
                    {formatRole(user.role)}
                  </strong>
                </div>

              </div>

            </div>

          </div>

        </div>


        {/* =================================
            STATISTICS
        ================================== */}

        <div className="section-heading">

          <div>
            <h2>My Activity</h2>
            <p>
              Overview of your ReWear activity
            </p>
          </div>

        </div>


        <div className="profile-stats">

          {/* ORDERS */}

          <div className="stat-card">

            <div className="stat-icon orders">
              🛍
            </div>

            <div className="stat-details">
              <span>Total Orders</span>
              <strong>0</strong>
              <small>Orders placed</small>
            </div>

          </div>


          {/* WISHLIST */}

          <div className="stat-card">

            <div className="stat-icon wishlist">
              ♡
            </div>

            <div className="stat-details">
              <span>Wishlist</span>
              <strong>0</strong>
              <small>Saved products</small>
            </div>

          </div>


          {/* LISTINGS */}

          <div className="stat-card">

            <div className="stat-icon listings">
              👕
            </div>

            <div className="stat-details">
              <span>My Listings</span>
              <strong>0</strong>
              <small>Products listed</small>
            </div>

          </div>

        </div>


        {/* =================================
            SECURITY
        ================================== */}

        <div className="profile-card security-card">

          <div className="security-left">

            <div className="security-icon">
              🔒
            </div>

            <div>
              <h2>Account Security</h2>

              <p>
                Protect your account and keep your
                personal information secure.
              </p>
            </div>

          </div>

          <button
            className="security-btn"
            onClick={() =>
              alert("Change password feature coming soon.")
            }
          >
            Change Password
          </button>

        </div>


        {/* =================================
            QUICK LINKS
        ================================== */}

        <div className="profile-card quick-links-card">

          <h2>Quick Links</h2>

          <div className="quick-links">

            <button
              onClick={() => navigate("/customer/orders")}
            >
              <span>🛍</span>
              <div>
                <strong>My Orders</strong>
                <small>View your orders</small>
              </div>
              <b>→</b>
            </button>

            <button
              onClick={() => navigate("/customer/wishlist")}
            >
              <span>♡</span>
              <div>
                <strong>Wishlist</strong>
                <small>View saved products</small>
              </div>
              <b>→</b>
            </button>

            <button
              onClick={() => navigate("/customer/messages")}
            >
              <span>💬</span>
              <div>
                <strong>Messages</strong>
                <small>View your conversations</small>
              </div>
              <b>→</b>
            </button>

            <button
              onClick={() => navigate("/customer/notifications")}
            >
              <span>🔔</span>
              <div>
                <strong>Notifications</strong>
                <small>View notifications</small>
              </div>
              <b>→</b>
            </button>

          </div>

        </div>


        {/* =================================
            LOGOUT
        ================================== */}

        <div className="logout-section">

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            ↪ Logout
          </button>

        </div>


        <div className="profile-footer">
          <p>
            ReWear · Sustainable Fashion Marketplace
          </p>
        </div>

      </div>

    </div>
    </>
  );
};

export default Profile;