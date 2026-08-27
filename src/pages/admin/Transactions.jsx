import { useState, useEffect } from "react";
import "../../styles/Transactions.css";
import AdminNavbar from "../../components/AdminNavbar";
function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCommission, setTotalCommission] = useState(0);
  const [totalSales, setTotalSales] = useState(0);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/admin/transactions", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        
        const sales = data.transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const commission = data.transactions.reduce((sum, t) => sum + parseFloat(t.commission), 0);
        setTotalSales(sales);
        setTotalCommission(commission);
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
    <div className="transactions-page">
      <h1>Transactions</h1>
      
      <div className="summary-cards">
        <div className="summary-card">
          <h3>Total Sales</h3>
          <p>Rs. {totalSales.toLocaleString()}</p>
        </div>
        <div className="summary-card">
          <h3>Total Commission</h3>
          <p>Rs. {totalCommission.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="transactions-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Order ID</th>
              <th>Buyer</th>
              <th>Seller</th>
              <th>Amount</th>
              <th>Commission</th>
              <th>Seller Earning</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>#{t.order_id}</td>
                <td>{t.buyer_name}</td>
                <td>{t.seller_name}</td>
                <td>Rs. {parseFloat(t.amount).toLocaleString()}</td>
                <td>Rs. {parseFloat(t.commission).toLocaleString()}</td>
                <td>Rs. {parseFloat(t.seller_earning).toLocaleString()}</td>
                <td>{new Date(t.created_at).toLocaleDateString()}</td>
                <td><span className="status-completed">{t.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}

export default Transactions;