const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// Destination API routes
const destinationRoutes =
    require("./routes/destination.routes");

const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const debugRoutes =
    require("./routes/debug.routes");

const app = express();

// Parse JSON request body
app.use(express.json());

// Enable CORS
app.use(cors());

// Add security headers
app.use(helmet());

// Log HTTP requests
app.use(morgan("dev"));

// Health endpoint
app.get("/", (req, res) => {
    res.json({
        message: "API Running"
    });
});

// Register API routes
app.use(
    "/api",
    destinationRoutes
);

app.use(
    "/api",
    debugRoutes
);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;