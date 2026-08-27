import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import "../styles/CustomerNavbar.css";


function CustomerNavbar() {

  const [dropdownOpen, setDropdownOpen] = useState(false);


  return (

    <nav className="customer-navbar">


      <div className="navbar-logo">

        <img 
          src={logo} 
          alt="ReWear Logo"
          className="logo-image"
        />

        <span>
          ReWear
        </span>

      </div>


      <ul className="navbar-links">
<li>
          <Link to="/customer/dashboard">
            Dashboard
          </Link>
        </li>

        <li>
          <Link to="/customer/shop">
            Shop
          </Link>
        </li>

        <li>
          <Link to="/customer/sell-item">
            Sell Item
          </Link>
        </li>

        <li>
          <Link to="/customer/orders">
            My Orders
          </Link>
        </li>
        <li>
        <Link to="/customer/my-listings">
           My Listings
          </Link>
        </li>


        {/* Dropdown */}
        <li className="dropdown">

          <button
            className="dropdown-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            Account ▼
          </button>


          {dropdownOpen && (

            <div className="dropdown-menu">

              <Link to="/customer/messages">
                Messages
              </Link>

              <Link to="/customer/notifications">
                Notifications
              </Link>

              <Link to="/customer/wishlist">
                Wishlist
              </Link>

            </div>

          )}

        </li>


        <li>
          <Link to="/customer/profile">
            Profile
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

export default CustomerNavbar;