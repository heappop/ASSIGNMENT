/**
 * Frankfurter API Client
 * 
 * Responsible for fetching the latest currency exchange rates against INR.
 * This client is unique because it handles local INR currency requests locally 
 * without ever hitting the upstream network, optimizing latency.
 */

const { request } = require("../utils/upstream");
const cache = require("../cache/cache");
const CACHE_TTL = require("../constants/cacheTTL");
const stats = require("../lib/stats");
const { coalesce } = require("../utils/requestCoalescer");

/**
 * Retrieves the exchange rate to convert the given foreign currency into INR.
 * 
 * @param {string} currency - The base currency code (e.g., 'USD', 'EUR', 'IN')
 * @returns {Promise<Object>} An object containing the rate multiplier.
 */
async function getFx(currency) {
    // Standardize input string
    const normalizedCurrency = (currency || "").trim().toUpperCase();
    const cacheKey = `fx:${normalizedCurrency}`;

    // Return the cached rate instantly if available
    const cached = cache.get(cacheKey);
    if (cached) {
        return cached;
    }

    // Coalesce identical requests so we don't spam the API for the same currency 
    // at the same exact time.
    return coalesce(cacheKey, async () => {
        // Optimization check: If the destination is already in India (currency IN or INR), 
        // the exchange rate is exactly 1. We bypass the upstream API entirely!
        if (normalizedCurrency === "IN" || normalizedCurrency === "INR") {
            const result = {
                status: "ok",
                data: {
                    currency: "INR",
                    rateToInr: 1
                }
            };
            
            // Cache this artificial result just like a normal response
            cache.set(cacheKey, result, CACHE_TTL.FX);
            return result;
        }

        // Only increment the stats counter if we actually need to hit the external API
        stats.increment("frankfurter");

        // Execute the GET request to fetch the latest rates against INR
        const response = await request({
            method: "GET",
            url: "https://api.frankfurter.app/latest",
            params: {
                from: normalizedCurrency,
                to: "INR"
            }
        });

        // Bubble up underlying HTTP errors
        if (response.status !== "ok") {
            return response;
        }

        // Safely extract the INR multiplier from the rates object
        const rateToInr = response.data?.rates?.INR ?? null;

        const result = {
            status: "ok",
            data: {
                currency: normalizedCurrency,
                rateToInr,
                // Track the actual date the rate was published
                validAt: response.data.date
            }
        };

        // Cache the parsed response using the daily TTL
        cache.set(cacheKey, result, CACHE_TTL.FX);

        return result;
    });
}

module.exports = {
    getFx
};