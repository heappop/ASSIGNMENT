// API service module
// Centralizes all network requests to our backend server
// The frontend only communicates with our backend, never directly with upstream external APIs.

import axios from "axios";

// Create an axios instance with base configuration
const api = axios.create({
    baseURL: "/api",
    timeout: 30000 // 30 seconds timeout to handle potentially slow responses
});

/**
 * Fetch destinations data by array of city names
 * @param {Array<string>} cities - List of city names to fetch
 */
export async function getDestinations(cities) {
    // Join city array to comma-separated string for query param
    const query = cities.join(",");
    
    // Perform GET request to /api/destinations?cities=jaipur,goa
    const response = await api.get("/destinations", {
        params: { cities: query }
    });
    
    // Return the response payload
    return response.data;
}

/**
 * Force refresh destination data in backend cache
 * @param {Array<string>} cities - List of cities to refresh
 */
export async function refreshDestinations(cities) {
    // Perform POST request to /api/refresh with body containing cities
    const response = await api.post("/refresh", {
        cities: cities
    });
    
    // Return the response payload
    return response.data;
}

export default api;
