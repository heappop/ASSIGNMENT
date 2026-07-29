/**
 * Open-Meteo Weather API Client
 * 
 * Responsible for fetching the 14-day weather forecast required for our event scoring logic.
 * The response includes daily maximum/minimum temperatures, precipitation probabilities, and wind speeds.
 */

const { request } = require("../utils/upstream");
const cache = require("../cache/cache");
const CACHE_TTL = require("../constants/cacheTTL");
const stats = require("../lib/stats");
const { coalesce } = require("../utils/requestCoalescer");

/**
 * Gets a 14-day forecast for the given exact coordinates.
 * 
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<Object>} An object containing an array of day forecasts.
 */
async function getWeather(latitude, longitude) {
    // Generate a unique memory cache key from the exact coordinates
    const cacheKey = `weather:${latitude}:${longitude}`;

    // If we already have fresh weather for this spot, short-circuit the network call
    const cached = cache.get(cacheKey);
    if (cached) {
        return cached;
    }

    // Wrap the request in a coalesce block so that concurrent requests for the same city 
    // wait on a single shared HTTP call.
    return coalesce(cacheKey, async () => {
        
        // Log telemetry
        stats.increment("openmeteo");

        // Request the specific daily variables we need for the scoring engine
        const response = await request({
            method: "GET",
            url: "https://api.open-meteo.com/v1/forecast",
            params: {
                latitude,
                longitude,
                daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
                forecast_days: 14, // We only care about the next two weeks
                timezone: "auto"
            }
        });

        // Bubble up transport or timeout errors immediately
        if (response.status !== "ok") {
            return response;
        }

        const daily = response.data.daily;

        // Map the raw parallel arrays provided by Open-Meteo into an array of clean, typed objects
        const days = daily.time.map((date, index) => {
            return {
                date,
                // Nullish coalescing is used defensively in case specific data points are missing 
                // in the upstream payload for certain days.
                tempMax: daily.temperature_2m_max[index] ?? null,
                tempMin: daily.temperature_2m_min[index] ?? null,
                precipProbability: daily.precipitation_probability_max[index] ?? null,
                windMax: daily.wind_speed_10m_max[index] ?? null
            };
        });

        const result = {
            status: "ok",
            data: {
                days,
                // Track the actual creation time of the forecast data 
                validAt: response.data.daily.time[0]
            }
        };

        // Cache the successful payload based on the designated weather TTL
        cache.set(cacheKey, result, CACHE_TTL.WEATHER);

        return result;
    });
}

module.exports = {
    getWeather
};