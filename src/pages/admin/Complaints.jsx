import { API_BASE_URL } from "../../api.js";

import { useState, useEffect } from "react";
import "../../styles/Complaints.css";
import AdminNavbar from "../../components/AdminNavbar";
function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState({});
  const [error, setError] = useState("");
  const [attachments, setAttachments] = useState({});
  const [attachmentsLoading, setAttachmentsLoading] = useState({});
  const [expandedAttachments, setExpandedAttachments] = useState({});

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/admin/complaints`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Could not load complaints. Please try again.");
      const data = await response.json();
      setComplaints(data.complaints || []);
    } catch (error) {
      console.error("Error loading complaints:", error);
      setError(error.message || "Could not load complaints. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (complaintId) => {
    const adminResponse = (responses[complaintId] || "").trim();
    if (!adminResponse) {
      setError("Enter a response before resolving the complaint.");
      return;
    }

    try {
      setError("");
      const token = localStorage.getItem("token");
      const result = await fetch(`${API_BASE_URL}/api/admin/complaints/${complaintId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: "resolved", admin_response: adminResponse })
      });
      if (!result.ok) {
        const data = await result.json().catch(() => ({}));
        throw new Error(data.message || "Could not resolve complaint.");
      }
      setResponses((current) => ({ ...current, [complaintId]: "" }));
      await fetchComplaints();
    } catch (error) {
      console.error("Error resolving complaint:", error);
      setError(error.message || "Could not resolve complaint. Please try again.");
    }
  };

  const toggleAttachments = async (complaintId) => {
    if (expandedAttachments[complaintId]) {
      setExpandedAttachments((current) => ({ ...current, [complaintId]: false }));
      return;
    }

    setExpandedAttachments((current) => ({ ...current, [complaintId]: true }));
    if (attachments[complaintId]) return;

    try {
      setAttachmentsLoading((current) => ({ ...current, [complaintId]: true }));
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/api/admin/complaints/${complaintId}/attachments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Could not load complaint evidence.");
      }
      setAttachments((current) => ({
        ...current,
        [complaintId]: data.attachments || []
      }));
    } catch (error) {
      console.error("Error loading complaint attachments:", error);
      setError(error.message || "Could not load complaint evidence.");
    } finally {
      setAttachmentsLoading((current) => ({ ...current, [complaintId]: false }));
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
      {error && <p role="alert">{error}</p>}
      
      <div className="complaints-list">
        {complaints.length === 0 && !error && <p>No complaints found.</p>}
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

            {Number(complaint.attachment_count) > 0 && (
              <div className="complaint-evidence">
                <button
                  type="button"
                  className="complaint-evidence-toggle"
                  onClick={() => toggleAttachments(complaint.id)}
                >
                  {expandedAttachments[complaint.id] ? "Hide" : "View"} evidence
                  {" "}({complaint.attachment_count})
                </button>
                {expandedAttachments[complaint.id] && (
                  attachmentsLoading[complaint.id] ? (
                    <p>Loading evidence images...</p>
                  ) : (
                    <div className="complaint-evidence-grid">
                      {(attachments[complaint.id] || []).map((attachment) => (
                        <a
                          key={attachment.id}
                          href={`data:${attachment.mime_type};base64,${attachment.data}`}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Open evidence image: ${attachment.original_name}`}
                        >
                          <img
                            src={`data:${attachment.mime_type};base64,${attachment.data}`}
                            alt={attachment.original_name}
                            loading="lazy"
                          />
                          <span>{attachment.original_name}</span>
                        </a>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}
            
            {complaint.admin_response && (
              <div className="admin-response">
                <strong>Response:</strong> {complaint.admin_response}
              </div>
            )}
            
            {complaint.status !== 'resolved' && (
              <div className="response-form">
                <textarea
                  placeholder="Type your response..."
                  value={responses[complaint.id] || ""}
                  onChange={(e) => setResponses((current) => ({
                    ...current,
                    [complaint.id]: e.target.value
                  }))}
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