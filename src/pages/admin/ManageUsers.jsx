import { API_BASE_URL } from "../../api.js";

import { useState, useEffect } from "react";
import "../../styles/ManageUsers.css";
import AdminNavbar from "../../components/AdminNavbar.jsx";

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [addForm, setAddForm] = useState({
    role: "customer",
    fullName: "",
    companyName: "",
    businessRegistrationId: "",
    companyAddress: "",
    email: "",
    phone: "",
    password: ""
  });
  const [addError, setAddError] = useState("");
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal
  const handleEditClick = (user) => {
    setEditUser(user);
    setEditForm({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "customer"
    });
    setShowEditModal(true);
  };

  // Handle edit form changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save edited user
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!editForm.fullName.trim()) {
      alert("Name is required");
      return;
    }
    if (!editForm.email.trim()) {
      alert("Email is required");
      return;
    }
    if (!editForm.phone.trim()) {
      alert("Phone is required");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${editUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: editForm.fullName,
          email: editForm.email,
          phone: editForm.phone,
          role: editForm.role
        })
      });

      if (response.ok) {
        // Update user in local state
        setUsers(users.map(u => 
          u.id === editUser.id 
            ? { ...u, ...editForm }
            : u
        ));
        alert("User updated successfully");
        setShowEditModal(false);
        setEditUser(null);
      } else {
        const data = await response.json();
        alert(data.message || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
        alert("User deleted successfully");
      } else {
        const data = await response.json();
        alert(data.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Network error");
    }
  };

  // Update role directly from table
  const handleUpdateRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? {...u, role: newRole} : u));
        alert("User role updated successfully");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role");
    }
  };

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setAddForm((current) => ({ ...current, [name]: value }));
    setAddError("");
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddError("");

    const name = addForm.role === "retail" ? addForm.companyName : addForm.fullName;
    if (!name.trim() || !addForm.email.trim() || !addForm.phone.trim() || !addForm.password) {
      setAddError("Complete all required fields.");
      return;
    }
    if (addForm.password.length < 6) {
      setAddError("Password must be at least 6 characters.");
      return;
    }
    if (addForm.role === "retail" &&
        (!addForm.businessRegistrationId.trim() || !addForm.companyAddress.trim())) {
      setAddError("Enter the retail business registration ID and company address.");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(addForm)
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setAddError(data.message || "Failed to create user.");
        return;
      }

      setUsers((current) => [data.user, ...current]);
      setAddForm({
        role: "customer",
        fullName: "",
        companyName: "",
        businessRegistrationId: "",
        companyAddress: "",
        email: "",
        phone: "",
        password: ""
      });
      setShowAddModal(false);
    } catch (error) {
      console.error("Error creating user:", error);
      setAddError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
                         user.email?.toLowerCase().includes(search.toLowerCase()) ||
                         user.phone?.includes(search);
    const matchesFilter = filter === "all" || user.role === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) return (
    <>
      <AdminNavbar />
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading users...</p>
      </div>
    </>
  );

  return (
    <>
      <AdminNavbar />
      <div className="manage-users">
        <div className="page-header">
          <div>
            <h1>Manage Users</h1>
            <p className="user-count">Total Users: {users.length}</p>
          </div>
          <button
            type="button"
            className="add-user-btn"
            onClick={() => {
              setAddError("");
              setShowAddModal(true);
            }}
          >
            + Add User
          </button>
        </div>
        
        {/* Search and Filter Controls */}
        <div className="controls">
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Roles ({users.length})</option>
            <option value="customer">Customers ({users.filter(u => u.role === 'customer').length})</option>
            <option value="retail">Retail Partners ({users.filter(u => u.role === 'retail').length})</option>
            <option value="admin">Admins ({users.filter(u => u.role === 'admin').length})</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">No users found</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>#{user.id}</td>
                    <td>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>{user.phone}</td>
                    <td>
                      <select 
                        value={user.role} 
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        className="role-select"
                      >
                        <option value="customer">Customer</option>
                        <option value="retail">Retail</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="action-buttons">
                      <button 
                        className="edit-btn"
                        onClick={() => handleEditClick(user)}
                        title="Edit User"
                      >
                        ✏️
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteUser(user.id)}
                        title="Delete User"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal add-user-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add User</h2>
                <button
                  type="button"
                  className="modal-close-btn"
                  aria-label="Close add user form"
                  onClick={() => setShowAddModal(false)}
                >
                  ✕
                </button>
              </div>

              {addError && <p className="add-user-error" role="alert">{addError}</p>}
              <form onSubmit={handleAddUser} className="edit-form">
                <div className="form-group">
                  <label htmlFor="new-user-role">Role *</label>
                  <select id="new-user-role" name="role" value={addForm.role} onChange={handleAddChange}>
                    <option value="customer">Customer</option>
                    <option value="retail">Retail Partner</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {addForm.role === "retail" ? (
                  <>
                    <div className="form-group">
                      <label htmlFor="new-user-company">Company Name *</label>
                      <input id="new-user-company" name="companyName" value={addForm.companyName}
                        onChange={handleAddChange} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="new-user-registration">Business Registration ID *</label>
                      <input id="new-user-registration" name="businessRegistrationId"
                        value={addForm.businessRegistrationId} onChange={handleAddChange} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="new-user-address">Company Address *</label>
                      <textarea id="new-user-address" name="companyAddress" rows="3"
                        value={addForm.companyAddress} onChange={handleAddChange} required />
                    </div>
                  </>
                ) : (
                  <div className="form-group">
                    <label htmlFor="new-user-name">Full Name *</label>
                    <input id="new-user-name" name="fullName" value={addForm.fullName}
                      onChange={handleAddChange} required />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="new-user-email">
                    {addForm.role === "retail" ? "Company Official Email *" : "Email *"}
                  </label>
                  <input id="new-user-email" type="email" name="email" value={addForm.email}
                    onChange={handleAddChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="new-user-phone">Telephone Number *</label>
                  <input id="new-user-phone" type="tel" name="phone" value={addForm.phone}
                    onChange={handleAddChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="new-user-password">Temporary Password *</label>
                  <input id="new-user-password" type="password" name="password"
                    value={addForm.password} onChange={handleAddChange}
                    minLength="6" autoComplete="new-password" required />
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="save-btn" disabled={saving}>
                    {saving ? "Creating..." : "Create User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && editUser && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Edit User</h2>
                <button 
                  className="modal-close-btn"
                  onClick={() => setShowEditModal(false)}
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSaveEdit} className="edit-form">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={editForm.fullName}
                    onChange={handleEditChange}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditChange}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleEditChange}
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <select 
                    name="role" 
                    value={editForm.role} 
                    onChange={handleEditChange}
                  >
                    <option value="customer">Customer</option>
                    <option value="retail">Retail Partner</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="save-btn"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ManageUsers;