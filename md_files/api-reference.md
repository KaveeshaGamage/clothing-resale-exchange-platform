# API Reference

## Base URL

```text
http://localhost:5000/api
```

## Health check

```http
GET /api/health
```

Returns:
- server status
- timestamp
- available endpoint list

## Authentication routes

### Register user

```http
POST /api/auth/register
```

Request body example:

```json
{
  "fullName": "John Silva",
  "email": "john@gmail.com",
  "phone": "0771234567",
  "password": "password123",
  "role": "customer"
}
```

### Login user

```http
POST /api/auth/login
```

Request body example:

```json
{
  "email": "john@gmail.com",
  "password": "password123"
}
```

Response example:

```json
{
  "message": "Login success",
  "token": "JWT_TOKEN",
  "role": "customer"
}
```

### Get current user

```http
GET /api/auth/me
```

Requires JWT authentication.

### Logout user

```http
POST /api/auth/logout
```

Requires JWT authentication.

## Product routes

### Get available products

```http
GET /api/products/available
```

Used to fetch currently available and published product listings.

### Get seller listings

```http
GET /api/products/my-listings
```

Returns all listings for the logged-in seller.

### Get product by id

```http
GET /api/products/:id
```

### Create listing

```http
POST /api/products/list
```

Used by a customer to create or list a product for sale.

### Update listing

```http
PUT /api/products/:id
```

### Delete listing

```http
DELETE /api/products/:id
```

### Pending verifications

```http
GET /api/products/pending/verifications
```

Restricted to retail or admin users.

### Verify product

```http
PUT /api/products/:id/verify
```

Restricted to retail or admin users.

## Order routes

### Get my orders

```http
GET /api/orders/my-orders
```

### Get order details

```http
GET /api/orders/:id
```

### Create order

```http
POST /api/orders/create
```

### Cancel order

```http
PUT /api/orders/:id/cancel
```

### Get sales history

```http
GET /api/orders/sales/history
```

## Admin routes

### Dashboard stats

```http
GET /api/admin/dashboard-stats
```

### Get users

```http
GET /api/admin/users
```

### Create user

```http
POST /api/admin/users
```

### Delete user

```http
DELETE /api/admin/users/:id
```

### Update user role

```http
PUT /api/admin/users/:id/role
```

### Get listings

```http
GET /api/admin/listings
```

### Delete listing

```http
DELETE /api/admin/listings/:id
```

### Get transactions

```http
GET /api/admin/transactions
```

### Get complaints

```http
GET /api/admin/complaints
```

### Update complaint

```http
PUT /api/admin/complaints/:id
```

### Get settings

```http
GET /api/admin/settings
```

### Update settings

```http
PUT /api/admin/settings
```

### Get reports

```http
GET /api/admin/reports
```

## Retail routes

Retail endpoints support product verification and delivery management workflows.

## Cart, favorites, messages, notifications

The backend also exposes routes related to:
- cart
- favorites
- messages
- notifications

These are typically mounted under:

```text
/api/cart
/api/favorites
/api/messages
/api/notifications
```

## Authentication flow

1. User registers or logs in.
2. Backend validates credentials.
3. JWT token is returned.
4. Client stores token and sends it in the Authorization header.
5. Backend verifies the token and allows or denies access based on user role.

## Role-based access

The app uses role checks to control endpoint access:
- customer
- retail
- admin

## Notes

The API is designed around secure access control and role-aware functionality. The exact route behavior may evolve with the project as additional features are implemented.
