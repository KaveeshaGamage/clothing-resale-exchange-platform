import { API_BASE_URL } from "../../api.js";

import React, { useCallback, useEffect, useState } from "react";
import "../../styles/Messages.css";
import CustomerNavbar from "../../components/CustomerNavbar";

const Messages = () => {
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [complaintSubject, setComplaintSubject] = useState("");
  const [complaintDescription, setComplaintDescription] = useState("");
  const [complaintImages, setComplaintImages] = useState([]);
  const [complaintLoading, setComplaintLoading] = useState(false);
  const [refreshingComplaints, setRefreshingComplaints] = useState(false);
  const [complaintError, setComplaintError] = useState("");
  const [complaintSuccess, setComplaintSuccess] = useState("");

  const token = localStorage.getItem("token");

  const fetchComplaints = useCallback(async ({ background = false } = {}) => {
    setComplaintError("");
    if (!background) setRefreshingComplaints(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/customer/complaints/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to load complaints");
      }
      setComplaints(data.complaints || []);
      return true;
    } catch (error) {
      console.error("Customer complaints error:", error);
      setComplaintError(error.message || "Failed to load your complaints.");
      return false;
    } finally {
      setLoading(false);
      setRefreshingComplaints(false);
    }
  }, [token]);

  useEffect(() => {
    fetchComplaints();
    const refreshTimer = window.setInterval(
      () => fetchComplaints({ background: true }),
      30000
    );
    return () => window.clearInterval(refreshTimer);
  }, [fetchComplaints]);

  const handleComplaintImagesChange = (event) => {
    const selectedImages = Array.from(event.target.files || []);
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (selectedImages.length > 5) {
      setComplaintError("You can attach up to 5 images.");
      event.target.value = "";
      setComplaintImages([]);
      return;
    }
    if (selectedImages.some((file) => file.size > 5 * 1024 * 1024)) {
      setComplaintError("Each image must be 5 MB or smaller.");
      event.target.value = "";
      setComplaintImages([]);
      return;
    }
    if (selectedImages.some((file) => !allowedTypes.includes(file.type))) {
      setComplaintError("Use JPEG, PNG, or WebP images only.");
      event.target.value = "";
      setComplaintImages([]);
      return;
    }

    setComplaintError("");
    setComplaintImages(selectedImages);
  };

  const submitComplaint = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    setComplaintError("");
    setComplaintSuccess("");
    setComplaintLoading(true);

    const formData = new FormData();
    formData.append("subject", complaintSubject);
    formData.append("description", complaintDescription);
    complaintImages.forEach((image) => formData.append("images", image));

    try {
      const response = await fetch(`${API_BASE_URL}/api/customer/complaints`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to submit complaint");
      }

      setComplaintSubject("");
      setComplaintDescription("");
      setComplaintImages([]);
      form.reset();
      setComplaintSuccess(data.message || "Complaint submitted successfully.");
      await fetchComplaints();
    } catch (error) {
      console.error("Complaint submission error:", error);
      setComplaintError(error.message || "Failed to submit complaint.");
    } finally {
      setComplaintLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <CustomerNavbar />

        <div className="messages-loading">
          <div>
            <div className="messages-spinner"></div>
            <p>Loading your support messages...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <CustomerNavbar />

      <div className="messages-page">

        <div className="messages-container">

          <h1 className="messages-title">
            Messages &amp; Support
          </h1>

          <section className="customer-complaints" aria-labelledby="complaint-section-title">
            <div className="customer-complaints-heading">
              <div>
                <h2 id="complaint-section-title">Contact support</h2>
                <p>Send a complaint and follow up on responses from the admin team.</p>
              </div>
              <button
                type="button"
                className="refresh-complaints"
                onClick={() => fetchComplaints()}
                disabled={refreshingComplaints}
              >
                {refreshingComplaints ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {complaintError && <p className="complaint-form-message error" role="alert">{complaintError}</p>}
            {complaintSuccess && <p className="complaint-form-message success" role="status">{complaintSuccess}</p>}

            <form className="customer-complaint-form" onSubmit={submitComplaint}>
              <label>
                Subject
                <input
                  type="text"
                  value={complaintSubject}
                  onChange={(event) => setComplaintSubject(event.target.value)}
                  maxLength={200}
                  required
                  placeholder="Briefly describe the issue"
                />
              </label>
              <label>
                Description
                <textarea
                  value={complaintDescription}
                  onChange={(event) => setComplaintDescription(event.target.value)}
                  maxLength={10000}
                  rows={5}
                  required
                  placeholder="Provide the details that will help us investigate"
                />
              </label>
              <label>
                Evidence images (optional)
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleComplaintImagesChange}
                />
              </label>
              {complaintImages.length > 0 && (
                <p className="complaint-selected-files">
                  Selected: {complaintImages.map((image) => image.name).join(", ")}
                </p>
              )}
              <button type="submit" disabled={complaintLoading}>
                {complaintLoading ? "Submitting..." : "Submit Complaint"}
              </button>
            </form>

            <div className="customer-complaint-history">
              <h3>Support replies &amp; complaint history</h3>
              {complaints.length === 0 ? (
                <p>No complaints yet. Submit a complaint above and replies will appear here.</p>
              ) : (
                complaints.map((complaint) => (
                  <article className="customer-complaint-item" key={complaint.id}>
                    <div className="customer-complaint-item-heading">
                      <strong>{complaint.subject}</strong>
                      <span className={`status status-${complaint.status}`}>{complaint.status}</span>
                    </div>
                    <p className="customer-complaint-description">{complaint.description}</p>
                    <small>
                      Submitted {new Date(complaint.created_at).toLocaleDateString()}
                      {Number(complaint.attachment_count) > 0 &&
                        ` · ${complaint.attachment_count} evidence image(s)`}
                    </small>
                    {complaint.admin_response && (
                      <div className="customer-complaint-response" role="status">
                        <strong>Admin response</strong>
                        <p>{complaint.admin_response}</p>
                      </div>
                    )}
                    {!complaint.admin_response && complaint.status !== "resolved" && (
                      <p className="customer-complaint-pending">
                        The support team is reviewing this complaint. Their response will appear here.
                      </p>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>

        </div>

      </div>
    </>
  );
};

export default Messages;