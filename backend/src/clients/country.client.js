/**
 * REST Countries API Client
 * 
 * Fetches basic country metadata (like the primary currency and region) 
 * based on a standard ISO 3166-1 alpha-2 country code.
 */

const { request } = require("../utils/upstream");
const cache = require("../cache/cache");
const CACHE_TTL = require("../constants/cacheTTL");
const stats = require("../lib/stats");
const { coalesce } = require("../utils/requestCoalescer");

/**
 * Retrieves country details by its 2-letter ISO code.
 * 
 * @param {string} countryCode - The 2-letter country code (e.g., 'IN', 'US')
 * @returns {Promise<Object>} An object containing name, currency, and region.
 */
async function getCountry(countryCode) {
    // Clean up the code to ensure predictable cache keys (e.g. ' in ' -> 'IN')
    const normalizedCountryCode = countryCode.trim().toUpperCase();
    const cacheKey = `country:${normalizedCountryCode}`;

    // Fast-path: Return from memory if it's already been fetched recently
    const cached = cache.get(cacheKey);
    if (cached) {
        return cached;
    }

    // Coalesce concurrent requests for the same country code to prevent duplicated upstream load
    return coalesce(cacheKey, async () => {
        // Record telemetry for debug endpoints
        stats.increment("restcountries");

        // Execute network request
        const response = await request({
            method: "GET",
            url: `https://restcountries.com/v3.1/alpha/${normalizedCountryCode}`
        });

        // Abort early if the HTTP layer returned a timeout or error
        if (response.status !== "ok") {
            return response;
        }

        let country = null;

        // The API sometimes wraps single results in an array depending on the exact endpoint hit.
        // We handle both payload formats here safely.
        if (Array.isArray(response.data) && response.data.length > 0) {
            country = response.data[0];
        } else if (response.data?.name) {
            country = response.data;
        }

        // If the payload was completely malformed, emit a custom error
        if (!country) {
            return {
                status: "error",
                error: "invalid_country_response",
                data: null
            };
        }

        // Extract and normalize just the fields we care about
        const result = {
            status: "ok",
            data: {
                name: country.name?.common,
                // Currencies come back as an object map, e.g. { INR: { name: "Rupee" } }
                // We just pluck the first key.
                currency: Object.keys(country.currencies || {})[0] || null,
                region: country.region
            }
        };

        // Store the successfully parsed result into our TTL-bound memory cache
        cache.set(cacheKey, result, CACHE_TTL.COUNTRY);

        return result;
    });
}

module.exports = {
    getCountry
};