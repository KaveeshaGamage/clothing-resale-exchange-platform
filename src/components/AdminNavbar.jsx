import { Link } from "react-router-dom";
import "../styles/AdminNavbar.css";
import logo from "../assets/logo.png";
function AdminNavbar() {

  return (

    <nav className="admin-navbar">


      <div className="navbar-logo">
        <img 
          src={logo} 
          alt="ReWear Logo"
          className="logo-image"
        />
        ReWear Admin
      </div>



      <ul className="navbar-links">


        <li>
          <Link to="/admin/dashboard">
            Dashboard
          </Link>
        </li>


        <li>
          <Link to="/admin/users">
            Manage Users
          </Link>
        </li>


        <li>
          <Link to="/admin/listings">
            Manage Listings
          </Link>
        </li>


        <li>
          <Link to="/admin/partners">
            Retail Partners
          </Link>
        </li>


        <li>
          <Link to="/admin/complaints">
            Complaints
          </Link>
        </li>


        <li>
          <Link to="/admin/transactions">
            Transactions
          </Link>
        </li>


        <li>
          <Link to="/admin/reports">
            Reports
          </Link>
        </li>


        <li>
          <Link to="/admin/settings">
            Settings
          </Link>
        </li>


        <li>
          <Link to="/">
            Logout
          </Link>
        </li>


      </ul>


    </nav>

  );

}

export default AdminNavbar;