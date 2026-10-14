const mysql = require("mysql2");
require("dotenv").config();

const useSsl = process.env.DB_SSL === "true";

const sslOptions = {
  minVersion: "TLSv1.2",
  rejectUnauthorized: process.env.DB_SSL_STRICT !== "false",
  ...(process.env.DB_CA && { ca: process.env.DB_CA.replace(/\\n/g, "\n") })
};

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "rewear",

  ...(useSsl && { ssl: sslOptions }),

  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }

  console.log("Database Connected Successfully");
  connection.release();
});

module.exports = db;
