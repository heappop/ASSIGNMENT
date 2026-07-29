/**
 * OpenStreetMap Nominatim Client
 * 
 * Fetches geographical coordinates (latitude and longitude) for a city name.
 * Due to OpenStreetMap's strict usage policies, this client is placed behind 
 * a centralized, asynchronous rate limiter queue in addition to standard request coalescing.
 */

const { request } = require("../utils/upstream");
const cache = require("../cache/cache");
const CACHE_TTL = require("../constants/cacheTTL");
const { schedule } = require("../cache/rateLimiter");
const stats = require("../lib/stats");
const { coalesce } = require("../utils/requestCoalescer");

/**
 * Searches for a city's details and metadata using Nominatim.
 * 
 * @param {string} query - The name of the city (e.g., 'Jaipur')
 * @returns {Promise<Object>} An object containing the mapped latitude and longitude.
 */
async function searchCity(query) {
    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = `nominatim:${normalizedQuery}`;

    // Fast memory return - avoids both the rate limiter queue and the network.
    const cached = cache.get(cacheKey);
    if (cached) {
        return cached;
    }

    // Two layers of protection here:
    // 1. `coalesce` prevents 5 concurrent requests for "Jaipur" from entering the queue.
    // 2. `schedule` ensures that requests for "Jaipur", "Goa", and "Delhi" are staggered 
    //    by 1 second to honor the 1-request-per-second max policy.
    return coalesce(cacheKey, () => schedule(async () => {

        // Track how many actual requests made it out to the internet
        stats.increment("nominatim");

        // The assignment mandates a strict 1 req/sec policy. We identify ourselves explicitly.
        const response = await request({
            method: "GET",
            url: "https://nominatim.openstreetmap.org/search",
            params: {
                q: normalizedQuery,
                format: "json",
                limit: 5
            },
            headers: {
                // Nominatim demands a custom User-Agent to track abuse
                "User-Agent": "saltstayz-destination-board"
            }
        });

        // Ensure we gracefully handle unexpected upstream formats
        const normalizedResults = Array.isArray(response.data) ? response.data : [];

        // Map the results to our internal interface, extracting only needed geographical fields
        const result = {
            status: "ok",
            data: normalizedResults.map(city => ({
                name: city.name,
                lat: Number(city.lat),
                lon: Number(city.lon),
                display_name: city.display_name,
                // Fallback chaining for country detection 
                country: city.address?.country || city.country || null,
                countryCode: (city.address?.country_code || city.country_code || "").toUpperCase()
            }))
        };

        // Save into cache for the maximum duration (coordinates rarely change)
        cache.set(cacheKey, result, CACHE_TTL.NOMINATIM);

        return result;
    }));
}

module.exports = {
    searchCity
};