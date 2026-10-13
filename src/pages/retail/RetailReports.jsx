import { API_BASE_URL } from "../../api.js";

import { useState, useEffect } from "react";
import "../../styles/RetailReports.css";
import RetailNavbar from "../../components/RetailNavbar";
function RetailReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/retail/reports`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary
  const totalDeliveries = reports.reduce((sum, r) => sum + (r.total_deliveries || 0), 0);
  const totalDelivered = reports.reduce((sum, r) => sum + (r.delivered || 0), 0);
  const totalFailed = reports.reduce((sum, r) => sum + (r.failed || 0), 0);
  const successRate = totalDeliveries > 0 ? ((totalDelivered / totalDeliveries) * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <>
        <RetailNavbar />
    <div className="retail-reports">
      <div className="page-header" style={{
        background: 'linear-gradient(135deg, #1b5e20, #2e7d32)',
        color: 'white',
        padding: '25px 30px',
        borderRadius: '12px',
        marginBottom: '25px',
        boxShadow: '0 4px 15px rgba(46,125,50,0.3)'
      }}>
        <h1 style={{ fontSize: '1.5rem', margin: '0 0 5px', color: 'white' }}>Delivery Reports</h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}>Track your delivery performance</p>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          textAlign: 'center',
          border: '1px solid #e8f5e9',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>🚚</span>
          <h3 style={{ fontSize: '1.8rem', color: '#2e7d32', margin: '0 0 5px' }}>{totalDeliveries}</h3>
          <p style={{ color: '#666', margin: 0, textTransform: 'uppercase', fontSize: '0.9rem' }}>Total Deliveries</p>
        </div>

        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          textAlign: 'center',
          border: '1px solid #e8f5e9',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>✅</span>
          <h3 style={{ fontSize: '1.8rem', color: '#4caf50', margin: '0 0 5px' }}>{totalDelivered}</h3>
          <p style={{ color: '#666', margin: 0, textTransform: 'uppercase', fontSize: '0.9rem' }}>Delivered</p>
        </div>

        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          textAlign: 'center',
          border: '1px solid #e8f5e9',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>❌</span>
          <h3 style={{ fontSize: '1.8rem', color: '#e53935', margin: '0 0 5px' }}>{totalFailed}</h3>
          <p style={{ color: '#666', margin: 0, textTransform: 'uppercase', fontSize: '0.9rem' }}>Failed</p>
        </div>

        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          textAlign: 'center',
          border: '1px solid #e8f5e9',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
        }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>📊</span>
          <h3 style={{ fontSize: '1.8rem', color: '#2196F3', margin: '0 0 5px' }}>{successRate}%</h3>
          <p style={{ color: '#666', margin: 0, textTransform: 'uppercase', fontSize: '0.9rem' }}>Success Rate</p>
        </div>
      </div>

      {/* Reports Table */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        border: '1px solid #e8f5e9'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' }}>
              <th style={{
                padding: '15px',
                textAlign: 'left',
                fontWeight: 700,
                color: '#1b5e20',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                borderBottom: '2px solid #a5d6a7'
              }}>Date</th>
              <th style={{
                padding: '15px',
                textAlign: 'center',
                fontWeight: 700,
                color: '#1b5e20',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                borderBottom: '2px solid #a5d6a7'
              }}>Total</th>
              <th style={{
                padding: '15px',
                textAlign: 'center',
                fontWeight: 700,
                color: '#1b5e20',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                borderBottom: '2px solid #a5d6a7'
              }}>Delivered</th>
              <th style={{
                padding: '15px',
                textAlign: 'center',
                fontWeight: 700,
                color: '#1b5e20',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                borderBottom: '2px solid #a5d6a7'
              }}>Failed</th>
              <th style={{
                padding: '15px',
                textAlign: 'center',
                fontWeight: 700,
                color: '#1b5e20',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                borderBottom: '2px solid #a5d6a7'
              }}>Success Rate</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
                  <span style={{ fontSize: '50px', display: 'block', marginBottom: '15px' }}>📋</span>
                  No report data available yet
                </td>
              </tr>
            ) : (
              reports.map((report, index) => {
                const rate = report.total_deliveries > 0 
                  ? ((report.delivered / report.total_deliveries) * 100).toFixed(1) 
                  : 0;
                
                return (
                  <tr 
                    key={index}
                    style={{
                      transition: 'all 0.3s',
                      borderBottom: '1px solid #f1f8e9'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(90deg, #f1f8e9, #e8f5e9)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '15px', color: '#333', fontWeight: 500 }}>
                      {new Date(report.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center', color: '#555' }}>
                      {report.total_deliveries}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: '#e8f5e9',
                        color: '#2e7d32',
                        borderRadius: '20px',
                        fontWeight: 600,
                        fontSize: '0.9rem'
                      }}>
                        {report.delivered}
                      </span>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: report.failed > 0 ? '#ffebee' : '#f5f5f5',
                        color: report.failed > 0 ? '#c62828' : '#999',
                        borderRadius: '20px',
                        fontWeight: 600,
                        fontSize: '0.9rem'
                      }}>
                        {report.failed}
                      </span>
                    </td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        background: rate >= 90 ? '#e8f5e9' : rate >= 70 ? '#fff3cd' : '#ffebee',
                        color: rate >= 90 ? '#2e7d32' : rate >= 70 ? '#f57f17' : '#c62828'
                      }}>
                        {rate}%
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}

export default RetailReports;