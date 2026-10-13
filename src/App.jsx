import { BrowserRouter, Routes, Route } from "react-router-dom";

import WelcomePage from "./pages/WelcomePage";
import Login from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import RetailDashboard from "./pages/retail/RetailDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CustomerShopPage from "./pages/customer/ShopPage";
import CustomerSellItem from "./pages/customer/SellItem"; 
import CustomerOrders from "./pages/customer/MyOrders";
import CustomerListings from "./pages/customer/MyListings";
import CartPage from "./pages/customer/Cart";
import OrderDetails from "./pages/customer/OrderDetails";
import Wishlist from "./pages/customer/Wishlist";
import Notifications from "./pages/customer/Notifications";
import Messages from "./pages/customer/Messages";
import Profile from "./pages/customer/Profile";

import AdminUsers from "./pages/admin/ManageUsers";
import AdminListings from "./pages/admin/ManageListings";
import AdminPartners from "./pages/admin/ManageRetailPartners";
import AdminComplaints from "./pages/admin/Complaints";
import AdminReports from "./pages/admin/Reports";
import AdminSystemSettings from "./pages/admin/SystemSettings";
import AdminTransactions from "./pages/admin/Transactions";

import ApprovedListings from "./pages/retail/ApprovedListings";
import PendingVerification from "./pages/retail/PendingVerifications";
import RejectedListings from "./pages/retail/RejectedListings";
import RetailDelivery from "./pages/retail/DeliveryManagement";
import RetailReports from "./pages/retail/RetailReports";
import UpdateDelivery from "./pages/retail/UpdateDelivery";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        <Route path="/customer/shop" element={<CustomerShopPage />} />
        <Route path="/customer/orders" element={<CustomerOrders />} />
        <Route path="/customer/sell-item" element={<CustomerSellItem />} />
        <Route path="/customer/my-listings" element={<CustomerListings />} />
        <Route path="/customer/cart" element={<CartPage />} />  
        <Route path="/customer/dashboard/cart" element={<CartPage />} />
        <Route path="/customer/order-details/:id" element={<OrderDetails />} />
        <Route path="/customer/wishlist" element={<Wishlist />} />
        <Route path="/customer/notifications" element={<Notifications />} />
        <Route path="/customer/messages" element={<Messages />} />  
        <Route path="/customer/profile" element={<Profile />} />

        <Route path="/retail/dashboard" element={<RetailDashboard />} />
        <Route path="/retail/approved-listings" element={<ApprovedListings />} />
        <Route path="/retail/pending-verification" element={<PendingVerification />} />
        <Route path="/retail/rejected-listings" element={<RejectedListings />} />
        <Route path="/retail/delivery-management" element={<RetailDelivery />} />
        <Route path="/retail/reports" element={<RetailReports />} />
        <Route path="/retail/update-delivery/:id" element={<UpdateDelivery />} />


        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/listings" element={<AdminListings />} />
        <Route path="/admin/partners" element={<AdminPartners />} />
        <Route path="/admin/complaints" element={<AdminComplaints />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/settings" element={<AdminSystemSettings />} />
        <Route path="/admin/transactions" element={<AdminTransactions />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;