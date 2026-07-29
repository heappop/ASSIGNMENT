/**
 * Upstream Network Utility
 * 
 * Centralized wrapper for making external HTTP requests. 
 * Provides unified timeout handling, error normalization, and a deterministic 
 * mock mode used for automated testing.
 */

const axios = require("axios");

// We enforce aggressive timeouts to prevent our BFF from hanging.
// Overpass is notoriously slow, so we give it slightly less leeway.
const DEFAULT_TIMEOUT = 5000;
const OVERPASS_TIMEOUT = 3000;

/**
 * Simulates upstream HTTP responses using local JSON fixtures.
 * This ensures the application can be evaluated entirely offline.
 */
function mockRequest(config) {
    const url = config.url || "";

    // Simulate an Overpass API timeout explicitly for failure isolation testing
    if (process.env.MOCK_OVERPASS_FAIL === "1" && url.includes("overpass")) {
        return Promise.reject({
            code: "upstream_timeout"
        });
    }

    // Map specific URLs to their corresponding static JSON fixtures
    if (url.includes("nominatim")) {
        return Promise.resolve({
            status: 200,
            data: require("../../fixtures/nominatim.json")
        });
    }

    if (url.includes("open-meteo")) {
        return Promise.resolve({
            status: 200,
            data: require("../../fixtures/openmeteo.json")
        });
    }

    if (url.includes("restcountries")) {
        return Promise.resolve({
            status: 200,
            data: require("../../fixtures/restcountries.json")
        });
    }

    if (url.includes("frankfurter")) {
        return Promise.resolve({
            status: 200,
            data: require("../../fixtures/frankfurter.json")
        });
    }

    if (url.includes("overpass")) {
        return Promise.resolve({
            status: 200,
            data: require("../../fixtures/overpass-success.json")
        });
    }

    // Generic fallback for unmapped endpoints
    return Promise.resolve({
        status: 200,
        data: {}
    });
}

/**
 * Executes a network request using Axios. Automatically wraps the response 
 * into a standardized { status, data, error } block format to simplify downstream usage.
 * 
 * @param {Object} config - Axios configuration options.
 * @returns {Promise<Object>} The standardized response payload.
 */
async function request(config) {
    // Intercept the request if we are running the offline evaluation suite
    if (process.env.MOCK === "1") {
        try {
            const mockRes = await mockRequest(config);
            return {
                status: "ok",
                data: mockRes.data
            };
        } catch (error) {
            return {
                status: error.code === "upstream_timeout" ? "timeout" : "error",
                error: error.message || "upstream_failed",
                data: null
            };
        }
    }

    try {
        // Enforce the correct timeout boundary based on the target domain
        const timeout = config.url?.includes("overpass") ? OVERPASS_TIMEOUT : DEFAULT_TIMEOUT;

        const response = await axios({
            timeout,
            // Disable Axios's default behavior of rejecting promises on 4xx/5xx codes
            // We want to handle these HTTP errors manually in our uniform wrapper.
            validateStatus: () => true,
            ...config
        });

        // Convert non-success HTTP codes into our structured error format
        if (response.status < 200 || response.status >= 300) {
            return {
                status: "error",
                error: `upstream_status_${response.status}`,
                data: null
            };
        }

        // Return the successfully retrieved payload
        return {
            status: "ok",
            data: response.data
        };

    } catch (error) {
        // Catch network-level anomalies (e.g. DNS failure, connection resets)
        return {
            status: error.code === "ECONNABORTED" ? "timeout" : "error",
            error: error.message || "upstream_failed",
            data: null
        };
    }
}

module.exports = {
    request
};