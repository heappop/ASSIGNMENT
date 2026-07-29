/**
 * Refresh Service
 * 
 * This module exports the `refreshCities` function which handles cache invalidation 
 * for requested destinations. It ensures stale data is wiped so the next request 
 * pulls fresh data from upstream services.
 */

const cache = require("../cache/cache");
const { searchCity } = require("../clients/nominatim.client");

/**
 * Clears cached entries associated with the provided cities.
 * 
 * @param {Array<string>} cities - List of city queries to refresh.
 * @returns {Object} A success response containing details of the cleared cache keys.
 */
async function refreshCities(cities) {
    const refreshed = [];

    // Process each city query independently
    for (const city of cities) {
        // Sanitize the query
        const cityKey = String(city || "").trim();

        if (!cityKey) {
            continue; // Skip invalid or empty inputs
        }

        // We track what blocks we are clearing for reporting purposes
        const invalidated = ["weather", "fx", "poi", "country", "nominatim"];
        const removedCacheKeys = [];

        // 1. Resolve the city to coordinates since Weather and POI rely on lat/lon
        const nominatimResult = await searchCity(cityKey);
        
        if (nominatimResult?.status === "ok" && Array.isArray(nominatimResult.data) && nominatimResult.data.length > 0) {
            const resolved = nominatimResult.data[0];
            const lat = Number(resolved.lat);
            const lon = Number(resolved.lon);
            const countryCode = String(resolved.countryCode || "").trim().toUpperCase();

            // 2. Clear coordinate-bound caches (Weather and POI density)
            if (Number.isFinite(lat) && Number.isFinite(lon)) {
                const weatherKey = `weather:${lat}:${lon}`;
                const poiKey = `poi:${lat}:${lon}`;
                
                cache.remove(weatherKey);
                cache.remove(poiKey);
                
                removedCacheKeys.push(weatherKey, poiKey);
            }

            // 3. Clear country metadata cache using the resolved country code
            if (countryCode) {
                const countryKey = `country:${countryCode}`;
                
                cache.remove(countryKey);
                removedCacheKeys.push(countryKey);
            }
        }

        // 4. Clear the Nominatim cache for this specific query
        const nominatimCacheKey = `nominatim:${cityKey.toLowerCase()}`;
        cache.remove(nominatimCacheKey);
        removedCacheKeys.push(nominatimCacheKey);

        // 5. Clear global FX rates for INR since we convert everything to INR
        cache.remove("fx:INR");
        cache.remove("fx:IN");
        removedCacheKeys.push("fx:INR", "fx:IN");

        // Record the operation
        refreshed.push({
            city: cityKey,
            invalidated,
            removedCacheKeys
        });
    }

    return {
        status: "ok",
        data: refreshed
    };
}

module.exports = {
    refreshCities
};
