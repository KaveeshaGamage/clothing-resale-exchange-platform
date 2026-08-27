import { useState, useEffect } from "react";
import "../../styles/Reports.css";
import AdminNavbar from "../../components/AdminNavbar";
function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/admin/reports", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <>
        <AdminNavbar />
    <div className="reports-page">
      <h1>Reports</h1>
      
      <div className="reports-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Orders</th>
              <th>Revenue</th>
              <th>Commission</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report, index) => (
              <tr key={index}>
                <td>{new Date(report.date).toLocaleDateString()}</td>
                <td>{report.orders}</td>
                <td>Rs. {parseFloat(report.revenue || 0).toLocaleString()}</td>
                <td>Rs. {parseFloat(report.commission || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}

export default Reports;