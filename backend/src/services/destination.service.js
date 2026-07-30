/**
 * Destination Aggregation Service
 * 
 * Orchestrates fetching data across multiple third-party upstreams for each requested city.
 * Implements architectural resiliency: each independent widget is fetched inside parallel blocks
 * so that slow or degraded upstreams (such as the notoriously flaky Overpass POI API) can fail
 * gracefully without bringing down the HTTP 200 payload for the remaining data points.
 */

const { searchCity } = require("../clients/nominatim.client");
const { getWeather } = require("../clients/weather.client");
const { getFx } = require("../clients/fx.client");
const { getCountry } = require("../clients/country.client");
const { getPoi } = require("../clients/poi.client");
const { scoreWindows } = require("../lib/score");
const { successBlock, errorBlock } = require("../utils/blockResponse");

// Standard Target Currency for hotel financial planning in Indian cities
const DEFAULT_TARGET_CURRENCY = "INR";

/**
 * Resolves a text query into geographical coordinates using Nominatim geocoding.
 * 
 * @param {string} query - City name requested by operations teams
 * @returns {Promise<Object|null>} Resolved metadata including coordinates and ISO country code
 */
async function resolveCity(query) {
    const result = await searchCity(query);

    if (result.status !== "ok" || !Array.isArray(result.data) || !result.data.length) {
        return null;
    }

    const city = result.data[0];

    return {
        name: city.name || query,
        country: city.country || city.display_name?.split(",")?.pop()?.trim() || "Unknown",
        countryCode: String(city.countryCode || "").toUpperCase(),
        lat: Number(city.lat),
        lon: Number(city.lon)
    };
}

/**
 * Normalizes raw upstream results into the rigorous block contract expected by the frontend.
 * Guarantees that every UI block carries a predictable status flag ('ok', 'error', or 'timeout').
 * 
 * @param {Object} result - Raw return value from an API client
 * @returns {Object} Standardized block payload
 */
function createBlock(result) {
    if (!result || typeof result !== "object") {
        return errorBlock({ message: "invalid_upstream_result" });
    }

    if (result.status === "ok") {
        return successBlock(result.data, {
            validAt: result.data?.validAt || null
        });
    }

    return errorBlock({
        code: result.status === "timeout" ? "TIMEOUT" : null,
        message: result.error || "upstream_error"
    });
}

/**
 * Simple retry helper that invokes an asynchronous operation with automatic retry attempts.
 * Mitigates intermittent network blips across public APIs without crashing the main service loop.
 * 
 * @param {Function} operation - Async function returning a promise
 * @param {number} retries - Maximum number of retries before abandoning
 * @param {number} delayMs - Milliseconds to delay between retries
 */
async function callWithRetry(operation, retries = 1, delayMs = 200) {
    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (attempt === retries) {
                throw error;
            }
            // Non-blocking backoff between failed connection attempts
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    throw lastError;
}

/**
 * Primary aggregator function that processes a batch of cities and returns fully structured, 
 * isolated block payloads ready for client rendering.
 * 
 * @param {Array<string>} cities - Array of city queries to evaluate
 * @returns {Promise<Object>} Formatted destination board payload
 */
async function getDestinations(cities = []) {
    const destinations = [];

    for (const query of cities) {
        // Step 1: Resolve Coordinates
        // Coordinate resolution is inherently serial because downstream weather and POI queries rely on latitude/longitude.
        const resolved = await resolveCity(query);

        if (!resolved) {
            destinations.push({
                query,
                resolved: null,
                blocks: {
                    weather: { status: "error", error: "city_not_found", data: null }
                }
            });
            continue;
        }

        // Step 2: Parallelize Upstream Fan-out
        // Utilize Promise.allSettled to enforce strict failure isolation. If an individual block throws an unhandled
        // connection rejection, the remaining blocks settle cleanly and render without missing a beat.
        const countryPromise = resolved.countryCode
            ? callWithRetry(() => getCountry(resolved.countryCode), 1)
            : Promise.resolve({ status: "ok", data: null });

        const [weatherResult, fxResult, countryResult, poiResult] = await Promise.allSettled([
            callWithRetry(() => getWeather(resolved.lat, resolved.lon), 1),
            callWithRetry(() => getFx(DEFAULT_TARGET_CURRENCY), 1),
            countryPromise,
            callWithRetry(() => getPoi(resolved.lat, resolved.lon), 1)
        ]);

        // Safely harvest resolved values or construct defensive error fallback blocks
        const weather = weatherResult.status === "fulfilled" ? weatherResult.value : { status: "error", error: weatherResult.reason?.message || "upstream_error" };
        const fx = fxResult.status === "fulfilled" ? fxResult.value : { status: "error", error: fxResult.reason?.message || "upstream_error" };
        const country = countryResult.status === "fulfilled" ? countryResult.value : { status: "error", error: countryResult.reason?.message || "upstream_error" };
        const poi = poiResult.status === "fulfilled" ? poiResult.value : { status: "error", error: poiResult.reason?.message || "upstream_error" };

        // Step 3: Local Logic Synthesis (Event Window Scoring)
        let bestWindow = { status: "error", data: null };

        if (weather.status === "ok" && weather.data?.days) {
            const scores = scoreWindows(weather.data.days);
            bestWindow = {
                status: "ok",
                data: scores[0] || null // Extract the #1 ranked event window for this destination
            };
        }

        // Step 4: Assemble Final Destination Card Packet
        destinations.push({
            query,
            resolved,
            blocks: {
                weather: createBlock(weather),
                bestWindow,
                fx: createBlock(fx),
                country: createBlock(country),
                poi: createBlock(poi)
            }
        });
    }

    return {
        generatedAt: new Date().toISOString(),
        destinations
    };
}

module.exports = {
    getDestinations
};