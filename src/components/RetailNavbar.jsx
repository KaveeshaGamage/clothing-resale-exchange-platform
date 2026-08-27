import { Link } from "react-router-dom";
import "../styles/RetailNavbar.css";
import logo from "../assets/logo.png";

function RetailNavbar(){

return(

<nav className="retail-navbar">


<div className="navbar-logo">

        <img 
          src={logo} 
          alt="ReWear Logo"
          className="logo-image"
        />
 ReWear Partner

</div>



<ul className="navbar-links">


<li>
<Link to="/retail/dashboard">
Dashboard
</Link>
</li>


<li>
<Link to="/retail/pending-verification">
Pending Verification
</Link>
</li>



<li>
<Link to="/retail/approved-listings">
Approved Listings
</Link>
</li>



<li>
<Link to="/retail/rejected-listings">
Rejected Listings
</Link>
</li>



<li>
<Link to="/retail/delivery-management">
Delivery Management
</Link>
</li>



<li>
<Link to="/retail/update-delivery">
Update Delivery Status
</Link>
</li>



<li>
<Link to="/retail/reports">
Reports
</Link>
</li>



<li>
<Link to="/">
Logout
</Link>
</li>



</ul>


</nav>

)

}


export default RetailNavbar;