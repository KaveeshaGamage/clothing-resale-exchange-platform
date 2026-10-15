# Project Structure

## Root-level structure

```text
Clothing_Plat/
├── backend/
├── public/
├── src/
├── diagrams/
├── documents/
├── md_files/
├── README.md
├── index.html
├── package.json
├── vite.config.js
└── .env.example
```

## Frontend structure

```text
src/
├── assets/
├── components/
├── pages/
├── styles/
├── App.jsx
├── index.css
├── main.jsx
└── api.js
```

### Frontend responsibilities

- App shell and routing
- Role-specific pages
- Reusable UI components
- API communication layer
- Styling and presentation logic

## Backend structure

```text
backend/
├── config/
├── controllers/
├── middleware/
├── migrations/
├── models/
├── routes/
├── .env.example
├── jest.config.cjs
├── package.json
├── server.js
└── .env
```

### Common backend responsibilities

- Request validation and routing
- Authentication and authorization
- Database access
- Business logic for products, orders, users, and complaints
- API responses and error handling

## Key files

### Root
- `README.md` — primary project description and setup guidance
- `package.json` — frontend project scripts and dependencies

### Backend
- `backend/server.js` — Express application entry point and route registration
- `backend/routes/*.js` — route definitions for auth, products, orders, admin, retail, and support modules
- `backend/controllers/*.js` — business logic handlers
- `backend/middleware/*.js` — auth and access control logic
- `backend/config/*.js` — database configuration
- `backend/models/*.js` — data model definitions

## Supporting project folders

### `diagrams/`
Contains architecture and workflow visual diagrams such as:
- component diagrams
- use case diagrams
- data flow diagrams

### `documents/`
Contains project documentation files and exported design artifacts.

### `md_files/`
This folder contains markdown documentation generated for the project. These are documentation-only files and do not affect application execution.

## Development workflow

The core app is split into:
- a frontend experience for users
- a backend API for business logic and data access
- a MySQL database for persistence

This separation keeps the system organized by role and responsibility while making the platform easier to extend.
