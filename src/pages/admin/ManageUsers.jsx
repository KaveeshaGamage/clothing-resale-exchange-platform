import { useState, useEffect } from "react";
import "../../styles/ManageUsers.css";
import AdminNavbar from "../../components/AdminNavbar";

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
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
      const response = await fetch("http://localhost:5000/api/admin/users", {
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
      const response = await fetch(`http://localhost:5000/api/admin/users/${editUser.id}`, {
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
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
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
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/role`, {
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
          <h1>Manage Users</h1>
          <p className="user-count">Total Users: {users.length}</p>
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