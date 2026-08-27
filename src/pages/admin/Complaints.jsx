import { useState, useEffect } from "react";
import "../../styles/Complaints.css";
import AdminNavbar from "../../components/AdminNavbar";
function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [response, setResponse] = useState("");

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/admin/complaints", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setComplaints(data.complaints || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (complaintId) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/admin/complaints/${complaintId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: "resolved", admin_response: response })
      });
      setSelectedComplaint(null);
      setResponse("");
      fetchComplaints();
      alert("Complaint resolved");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      urgent: "🔴 Urgent",
      high: "🟠 High",
      medium: "🟡 Medium",
      low: "🟢 Low"
    };
    return badges[priority] || priority;
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <>
        <AdminNavbar />
    <div className="complaints-page">
      <h1>Complaints & Disputes</h1>
      
      <div className="complaints-list">
        {complaints.map(complaint => (
          <div key={complaint.id} className="complaint-card">
            <div className="complaint-header">
              <h3>{complaint.subject}</h3>
              <span className={`priority ${complaint.priority}`}>
                {getPriorityBadge(complaint.priority)}
              </span>
              <span className={`status status-${complaint.status}`}>
                {complaint.status}
              </span>
            </div>
            <p className="description">{complaint.description}</p>
            <div className="complaint-meta">
              <span>From: {complaint.user_name} ({complaint.user_email})</span>
              <span>Date: {new Date(complaint.created_at).toLocaleDateString()}</span>
            </div>
            
            {complaint.admin_response && (
              <div className="admin-response">
                <strong>Response:</strong> {complaint.admin_response}
              </div>
            )}
            
            {complaint.status !== 'resolved' && (
              <div className="response-form">
                <textarea
                  placeholder="Type your response..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows="3"
                />
                <button onClick={() => handleResolve(complaint.id)}>
                  Resolve & Respond
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
    </>
  );
}

export default Complaints;