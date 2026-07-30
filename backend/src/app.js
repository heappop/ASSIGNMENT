/**
 * Express Application Setup & Middleware Pipeline
 * 
 * Configures global security headers, request logging, API routing, 
 * and production static serving for the React frontend SPA.
 */

const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const destinationRoutes = require("./routes/destination.routes");
const debugRoutes = require("./routes/debug.routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Parse JSON request payloads
app.use(express.json());

// Enable CORS for development cross-origin proxying
app.use(cors());

// Apply security HTTP headers; disable restrictive CSP so Google Fonts and external styles render smoothly
app.use(helmet({ contentSecurityPolicy: false }));

// Log HTTP requests for debugging
app.use(morgan("dev"));

// API Health Check Endpoint
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Destination Board BFF Active" });
});

// Register Core API & Debug Routes
app.use("/api", destinationRoutes);
app.use("/api", debugRoutes);

// --- Production Frontend Static Serving ---
// Serve the built React static assets from the frontend distribution directory
const frontendDist = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendDist));

// Single Page Application (SPA) Fallback
// Any unrecognized route outside of '/api' is routed to index.html so React Router can handle client URLs
app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
        return next();
    }
    res.sendFile(path.join(frontendDist, "index.html"));
});

// 404 Handler for unmatched /api endpoints
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

module.exports = app;