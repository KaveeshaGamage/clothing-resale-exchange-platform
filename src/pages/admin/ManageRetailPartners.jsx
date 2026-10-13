import { API_BASE_URL } from "../../api.js";

import { useState, useEffect } from "react";
import "../../styles/ManageRetailPartners.css";
import AdminNavbar from "../../components/AdminNavbar";
function ManageRetailPartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/admin/users?role=retail`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPartners(data.users.filter(u => u.role === 'retail'));
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
        <AdminNavbar /> 
    <div className="manage-retail">
      <h1>Retail Partners</h1>
      
      <div className="partners-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Joined</th>
              <th>Verified Listings</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {partners.map(partner => (
              <tr key={partner.id}>
                <td>{partner.id}</td>
                <td>{partner.fullName}</td>
                <td>{partner.email}</td>
                <td>{partner.phone}</td>
                <td>{new Date(partner.created_at).toLocaleDateString()}</td>
                <td>{Number(partner.verifiedListings) || 0}</td>
                <td><span className="status-active">Active</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}

export default ManageRetailPartners;