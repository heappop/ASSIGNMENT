/**
 * Point of Interest (POI) Client
 * 
 * Interfaces with the Overpass API to query nearby amenities and calculate 
 * density around specific coordinates. This is a deliberately slow and flaky API, 
 * requiring robust fallback handling.
 */

const {
    request
} = require("../utils/upstream");

const cache = require("../cache/cache");

const CACHE_TTL = require("../constants/cacheTTL");

const stats =
    require("../lib/stats");
const { coalesce } = require("../utils/requestCoalescer");



/**
 * Fetches the count of amenities (POIs) within a 2000m radius of the provided coordinates.
 * Utilizes the request coalescer to avoid bombarding Overpass during parallel requests.
 * 
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<Object>} The POI count or an error block if the upstream fails.
 */
async function getPoi(
    latitude,
    longitude
) {


    // Unique cache key derived from geographical coordinates
    const cacheKey = `poi:${latitude}:${longitude}`;

    // Return the density immediately if it's currently cached
    const cached = cache.get(cacheKey);
    if (cached) {
        return cached;
    }

    // Wrap the outgoing request in our coalescer. If multiple incoming requests 
    // ask for this exact coordinate pair concurrently, only the first one executes 
    // the Overpass call; the rest wait for its promise to resolve.
    return coalesce(cacheKey, async () => {

    // Construct the Overpass QL query string
    // This looks for any nodes with an 'amenity' tag within 2000 meters 
    // of the specified latitude and longitude, with a strict 20-second timeout.
    const query = `
[out:json][timeout:20];
node(around:2000,${latitude},${longitude})[amenity];
out count;
`;

    // Track upstream invocations for debugging and telemetry
    stats.increment("overpass");

    // Execute the POST request to the interpreter endpoint
    const response = await request({
            method: "POST",
            url: "https://overpass-api.de/api/interpreter",
            // Overpass expects the query payload in form-urlencoded format
            data: new URLSearchParams({
                data: query
            }).toString(),


            headers: {


                // Required headers for Overpass
                "Content-Type":
                    "application/x-www-form-urlencoded",


                "Accept":
                    "application/json",


                "User-Agent":
                    "saltstayz-destination-board"

            }

        });



    // Handle upstream failure
    if (response.status !== "ok") {

        return response;

    }



    // Extract the numeric count from the deeply nested Overpass JSON response.
    // If the path breaks or tags are missing, default to zero safely.
    const count = response.data?.elements?.[0]?.tags?.nodes ?? 0;



    const result = {

        status: "ok",

        data: {

            count:
                Number(count)

        }

    };

    cache.set(

        cacheKey,

        result,

        CACHE_TTL.POI

    );

    return result;

    });

}



module.exports = {

    getPoi

};