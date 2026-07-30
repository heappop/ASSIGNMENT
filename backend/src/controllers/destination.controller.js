/**
 * Destination HTTP Controller
 * 
 * Translates incoming HTTP requests into service layer invocations.
 * Extracts requested city query strings and formats the consolidated block responses.
 */

const { getDestinations } = require("../services/destination.service");

/**
 * GET /api/destinations?cities=jaipur,goa
 * 
 * Handles reading requested cities from URL query parameters, passes them down to
 * the multi-upstream orchestration layer, and returns an HTTP 200 payload.
 */
async function destinations(req, res) {
    try {
        // Parse comma-separated query string into a clean array of valid identifiers
        const cities = req.query.cities
            ?.split(",")
            .map(city => city.trim())
            .filter(Boolean) || [];

        // Fetch aggregated destination metrics across all available upstreams
        const result = await getDestinations(cities);

        // Always emit HTTP 200; individual degraded widgets carry their own internal status flags
        res.json(result);
    } catch (error) {
        console.error("Critical error inside destination aggregation controller:", error);
        res.status(500).json({
            error: "internal_server_error",
            message: "An unexpected exception prevented destination calculation."
        });
    }
}

module.exports = {
    destinations
};