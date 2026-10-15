# Project Overview

## Introduction

ReWear is a clothing resale and exchange platform designed to help people sell or exchange unused clothing items in a trusted environment. The platform encourages sustainable fashion by reducing textile waste while providing a safe and transparent marketplace for clothing transactions.

## Problem addressed

Many customers keep clothing items they no longer wear due to incorrect sizing, personal preference, or changing style needs. Rather than leaving these items unused, the platform gives them a way to resell or exchange them through a verified marketplace.

## Core goals

- Reduce clothing waste
- Promote sustainable fashion
- Provide a trusted resale marketplace
- Support product authenticity verification
- Simplify online resale and exchange workflows
- Enable secure digital transactions

## Main user roles

### 1. Customer
Customers can register, log in, manage profiles, browse listings, upload clothing, create sales, place orders, and track purchase or sales history.

Typical customer activities:
- Browse available products
- Sell unused clothing
- Upload product images and receipt details
- Search and filter listings
- Manage wishlist and cart
- Buy items
- Track orders and history

### 2. Retail Partner
Retail partners are responsible for validating customer listings and checking authenticity before a product becomes available to buyers.

Typical retail activities:
- Review pending verifications
- Confirm purchase details
- Approve or reject listings
- Manage deliveries
- Update delivery status
- Review reports

### 3. Administrator
Administrators manage the broader system, including users, listings, complaints, transactions, and platform settings.

Typical admin activities:
- Manage users and roles
- Review listings and complaints
- Monitor platform transactions
- Manage retail partner assignments
- Generate reports
- Configure system settings

## System architecture

The platform follows a simple three-tier structure:

- React frontend for the user interface
- Node.js / Express backend for API logic
- MySQL database for persistence

```text
ReWear Platform
  │
  ├── React Frontend
  │
  ├── Node.js Backend
  │     └── Express.js API
  │
  └── MySQL Database
```

## Functional modules

### Frontend
The frontend is built with React and Vite. It provides role-based experiences for customers, retail partners, and admins.

### Backend
The backend provides authentication, product management, order processing, complaints, notifications, favorites, admin controls, and retail workflows.

### Database
The database stores:
- users
- products/listings
- orders
- complaints
- notifications/messages
- retail verification data

## Product flow

1. A customer creates a listing for an item.
2. The item is assigned for verification or review.
3. A retail partner checks the original purchase evidence.
4. The listing is approved, rejected, or sent back for changes.
5. Approved listings become available in the marketplace.
6. Customers can browse and purchase available products.
7. Delivery and order tracking follow the transaction process.

## Security model

The system includes:
- password hashing with bcrypt
- JWT-based authentication
- role-based authorization
- protected API routes for different user groups

## Expected outcome

The project aims to create a trustworthy, sustainable clothing marketplace that allows customers to recover value from unused garments while making the buying process transparent and reliable.
