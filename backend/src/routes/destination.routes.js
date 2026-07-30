/**
 * Destination API Router
 * 
 * Defines the public endpoints for fetching destination dashboards and initiating force-refreshes.
 * Routes are mounted under the '/api' prefix inside the Express app.
 */

const express = require("express");
const { destinations } = require("../controllers/destination.controller");
const { refresh } = require("../controllers/refresh.controller");

const router = express.Router();

// Primary dashboard query endpoint
// Example usage: GET /api/destinations?cities=jaipur,goa
router.get("/destinations", destinations);

// Force cache invalidation and upstream re-fetching endpoint
// Example usage: POST /api/refresh with body { "cities": ["jaipur"] }
router.post("/refresh", refresh);

module.exports = router;