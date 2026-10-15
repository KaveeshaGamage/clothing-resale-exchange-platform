# Setup and Installation Guide

## Requirements

Before running the project, ensure you have:

- Node.js and npm installed
- MySQL installed and running
- Git installed
- A code editor like VS Code

## Repository structure

```text
Clothing_Plat/
├── backend/
├── src/
├── public/
├── README.md
├── package.json
├── index.html
└── md_files/
```

## 1. Clone the repository

```bash
git clone <repository-url>
cd Clothing_Plat
```

## 2. Install frontend dependencies

From the project root:

```bash
npm install
```

## 3. Install backend dependencies

```bash
cd backend
npm install
```

The backend package includes dependencies such as:
- express
- mysql2
- bcrypt
- jsonwebtoken
- dotenv
- cors
- multer

## 4. Configure environment variables

Create a `.env` file inside the `backend` folder based on the example in `.env.example`.

Example:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=rewear
JWT_SECRET=your_secret_key
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

Important:
- Do not commit the `.env` file to source control.
- Keep the database credentials and JWT secret secure.

## 5. Create the MySQL database

Log into MySQL and run:

```sql
CREATE DATABASE rewear;
USE rewear;
```

Then make sure the required tables exist or are created via database setup scripts or application logic.

## 6. Start the backend

From the backend folder:

```bash
npm start
```

Or in development mode:

```bash
npm run dev
```

The server should start on the configured port, typically:

```text
http://localhost:5000
```

## 7. Start the frontend

From the project root:

```bash
npm run dev
```

The Vite dev server usually runs on:

```text
http://localhost:5173
```

## 8. Verify the app works

Check the backend health endpoint:

```text
http://localhost:5000/api/health
```

A healthy response should include a status and metadata about available API routes.

## Common notes

- If the frontend port is occupied, Vite will select a different port.
- If MySQL is not running, the backend will fail to connect to the database.
- Use the `.env.example` file as a template for correct environment values.

## Recommended development flow

1. Start MySQL.
2. Start backend API.
3. Start frontend UI.
4. Test login, listing creation, product verification, and order flows.
