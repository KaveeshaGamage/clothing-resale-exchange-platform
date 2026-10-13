    KaveeshaGamage
    clothing-resale-exchange-platform

Repository navigation

    Code
    Issues5 (5)
    Pull requests
    Agents
    Discussions
    Actions
    Projects
    Wiki
    Security and quality
    Insights
    Settings

KaveeshaGamage
clothing-resale-exchange-platform
Public

tT
KaveeshaGamage
KaveeshaGamage
Merge pull request #1 from KaveeshaGamage/srs
be91819
 · 
2 months ago
Name	Last commit message
	Last commit date
Clothing Resale and Exchange Platform.docx
	
Add files via upload
	
2 months ago
README.md
	
Revise README with project details and structure
	
2 months ago
Repository files navigation

    README

ReWear – Clothing Resale & Exchange Platform

ReWear is a web-based Clothing Resale and Exchange Platform that allows customers to resell or exchange unused clothing items purchased from authorized retail partners.

The platform connects customers, retail partners, and administrators in a trusted marketplace. Retail partners can verify the authenticity and purchase details of listed clothing items before they are made available to buyers.
📌 Project Overview

Customers may have clothing items that are unused because of reasons such as incorrect size, color, or personal preference. ReWear provides a platform where these items can be resold or exchanged instead of remaining unused.

The system involves three main user roles:

    Customer – Buy, sell, and exchange clothing items.
    Retail Partner – Verify listed products and manage deliveries.
    Administrator – Manage users, listings, transactions, complaints, and system activities.

🎯 Objectives

The main objectives of ReWear are to:

    Reduce clothing waste.
    Provide a trusted platform for reselling and exchanging clothing.
    Allow retail partners to verify original purchases.
    Help customers buy genuine second-hand clothing.
    Provide secure online transactions.
    Support sustainable fashion practices.
    Allow retail partners to manage product verification and delivery.

👥 User Roles
1. Customer

Customers can:

    Register and log in.
    Manage their profile.
    Browse available clothing.
    Search and filter products.
    Sell unused clothing.
    Upload clothing images.
    Provide original receipt/order information.
    View their listings.
    Purchase clothing.
    View orders.
    View purchase history.
    View sales history.
    Manage wishlist.
    View messages and notifications.

2. Retail Partner

Retail partners can:

    Log in to the retail dashboard.
    View pending product verifications.
    Verify customer purchase details.
    Approve listings.
    Reject invalid listings.
    View approved listings.
    View rejected listings.
    Manage deliveries.
    Update delivery status.
    View retail reports.

3. Administrator

Administrators can:

    Manage users.
    Manage clothing listings.
    Manage retail partners.
    Monitor transactions.
    Manage complaints and disputes.
    Generate reports.
    Manage system settings.

🏗️ System Architecture

                    ReWear Platform
                          │
             ┌────────────┴────────────┐
             │                         │
        React Frontend            Node.js Backend
             │                         │
             │                    Express.js API
             │                         │
             └────────────┬────────────┘
                          │
                       MySQL
                          │
                       rewear
                          │
                    ┌─────┴─────┐
                    │           │
                  users       listings

🛠️ Technologies Used
Frontend

    React.js
    React Router
    Axios
    HTML5
    CSS3
    Vite

Backend

    Node.js
    Express.js
    MySQL
    mysql2
    bcrypt
    JSON Web Token (JWT)
    CORS

Database

    MySQL

Development Tools

    Visual Studio Code
    MySQL / MySQL Workbench
    Git
    GitHub
    npm

📂 Project Structure

Clothing_Plat/
│
├── frontend/
│   │
│   ├── public/
│   │   └── assets/
│   │       └── logo.png
│   │
│   ├── src/
│   │   │
│   │   ├── components/
│   │   │   ├── CustomerNavbar.jsx
│   │   │   ├── RetailNavbar.jsx
│   │   │   └── AdminNavbar.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   │
│   │   │   ├── customer/
│   │   │   ├── retail/
│   │   │   └── admin/
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── styles/
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── package.json
│   └── vite.config.js
│
│
└── backend/
    │
    ├── config/
    │   └── db.js
    │
    ├── controllers/
    │   ├── authController.js
    │   ├── userController.js
    │   ├── listingController.js
    │   ├── orderController.js
    │   └── deliveryController.js
    │
    ├── models/
    │   ├── User.js
    │   ├── Listing.js
    │   ├── Order.js
    │   └── Delivery.js
    │
    ├── routes/
    │   ├── authRoutes.js
    │   ├── userRoutes.js
    │   ├── listingRoutes.js
    │   ├── orderRoutes.js
    │   └── deliveryRoutes.js
    │
    ├── middleware/
    │   └── authMiddleware.js
    │
    ├── server.js
    ├── package.json
    └── .env

🗄️ Database Setup

Create the database in MySQL:

CREATE DATABASE rewear;

USE rewear;

Create the users table:

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullName VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255),
    role ENUM('customer', 'retail', 'admin'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Check the data:

SELECT * FROM users;

🔐 Authentication

ReWear uses role-based authentication.

During registration, the user selects:

Customer
Retail Partner
Administrator

The user's role is stored in the MySQL database.

During login:

Email + Password
       ↓
Node.js API
       ↓
MySQL
       ↓
Verify credentials
       ↓
Return user role
       ↓
Open appropriate dashboard

Dashboard Routing

Customer
   ↓
/customer/dashboard

Retail Partner
   ↓
/retail/dashboard

Administrator
   ↓
/admin/dashboard

Passwords should be securely hashed using bcrypt before being stored in the database.
🔌 API Endpoints
Authentication
Register

POST /api/auth/register

Example request:

{
  "fullName": "John Silva",
  "email": "john@gmail.com",
  "phone": "0771234567",
  "password": "password123",
  "role": "customer"
}

Login

POST /api/auth/login

Example request:

{
  "email": "john@gmail.com",
  "password": "password123"
}

Example response:

{
  "message": "Login success",
  "token": "JWT_TOKEN",
  "role": "customer"
}

⚙️ Backend Environment Variables

Create a .env file inside the backend directory.

PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=rewear

JWT_SECRET=your_secret_key

Do not upload the .env file to GitHub.

Add it to .gitignore:

node_modules/
.env

📦 Installation
1. Clone the Repository

git clone <repository-url>

Move into the project:

cd Clothing_Plat

2. Install Frontend Dependencies

cd frontend
npm install

Install Axios:

npm install axios

Install React Router:

npm install react-router-dom

3. Install Backend Dependencies

Open another terminal:

cd backend
npm install

Required backend packages include:

npm install express mysql2 cors bcrypt jsonwebtoken

▶️ Running the Application
Start MySQL

Make sure MySQL is running.

Make sure the database exists:

USE rewear;

SELECT * FROM users;

Start Backend

From the backend folder:

npm start

Expected output:

Server running on port 5000
Database Connected

Start Frontend

From the frontend folder:

npm run dev

Vite will display the frontend URL, for example:

http://localhost:5173

The port may be different if the default port is already being used.
🔄 Registration Flow

User opens Register page
          ↓
Enters personal information
          ↓
Selects account role
          ↓
React sends POST request
          ↓
Node.js / Express
          ↓
bcrypt hashes password
          ↓
MySQL INSERT
          ↓
users table
          ↓
Registration successful
          ↓
Login page

🔑 Login Flow

User enters email/password
          ↓
React sends POST request
          ↓
Node.js / Express
          ↓
Find user by email
          ↓
Compare password using bcrypt
          ↓
Generate JWT
          ↓
Return user role
          ↓
React checks role
          ↓
┌─────────────┬──────────────┬──────────────┐
│             │              │              │
Customer      Retail         Admin
│             │              │
↓             ↓              ↓
Customer      Retail         Admin
Dashboard     Dashboard      Dashboard

🛍️ Customer Features

Customer Dashboard
│
├── Profile
├── Buy Clothes
├── My Listings
├── Sell Item
├── My Orders
├── Purchase History
├── Sales History
├── Wishlist
├── Messages
└── Notifications

🏪 Retail Partner Features

Retail Dashboard
│
├── Pending Verifications
├── Approved Listings
├── Rejected Listings
├── Delivery Management
├── Update Delivery Status
└── Reports

👨‍💼 Administrator Features

Admin Dashboard
│
├── Manage Users
├── Manage Listings
├── Manage Retail Partners
├── Complaints
├── Transactions
├── Reports
└── System Settings

🔒 Security

The system is designed to provide:

    Password hashing using bcrypt.
    JWT-based authentication.
    Role-based access control.
    Input validation.
    Secure database queries using parameterized SQL.
    CORS configuration.
    Protection of database credentials using environment variables.

Passwords should never be stored as plain text in the production database.
🚀 Future Improvements

Possible future features include:

    Online payment gateway integration.
    Real-time delivery tracking.
    Product exchange functionality.
    Product recommendation system.
    Email notifications.
    SMS notifications.
    Advanced product search and filtering.
    Image storage using cloud storage.
    Retail partner verification using order numbers.
    Customer review and rating system.
    Analytics dashboard.
    Automated fraud detection.

🌱 Sustainability

ReWear supports sustainable fashion by encouraging customers to reuse clothing rather than leaving unwanted clothing unused.

The platform helps:

    Extend the useful life of clothing.
    Reduce unnecessary clothing waste.
    Encourage resale and exchange.
    Promote responsible consumption.
    Provide retailers with an additional service channel.

👨‍💻 Development

This project is developed as a web-based Clothing Resale and Exchange Platform using React, Node.js, Express.js, and MySQL.

The system follows a client-server architecture where the React frontend communicates with the Node.js backend through REST APIs, while MySQL provides persistent data storage.
📄 License

This project is developed for academic and educational purposes.
About

A web-based marketplace for reselling/exchanging unused clothing from authorized retailers. Features user management, listing with receipt verification, secure payments, retailer authentication, and delivery tracking — reducing waste and promoting sustainable fashion.
Resources
Readme
Activity
Stars
0 stars
Watchers
0 watching
Forks
0 forks
Releases
No releases published
Create a new release
Packages
No packages published
Publish your first package
Contributors
1 (1)

    @KaveeshaGamage
    KaveeshaGamageKaveesha Gamage

