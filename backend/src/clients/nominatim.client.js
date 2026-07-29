// Client for OpenStreetMap Nominatim geocoding API


const { request } =
    require("../utils/upstream");
const cache = require("../cache/cache");

const CACHE_TTL = require("../constants/cacheTTL");


const {
    schedule
} = require("../cache/rateLimiter");
const stats =
    require("../lib/stats");



// Fetch city coordinates
async function searchCity(query) {


    const normalizedQuery =
        query.trim().toLowerCase();


    const cacheKey =
        `nominatim:${normalizedQuery}`;


    // Check cache first
    const cached =
        cache.get(cacheKey);


    if (cached) {
        return cached;
    }


    return schedule(async () => {


        // Count only actual upstream calls
        stats.increment("nominatim");


        const response =
            await request({

                method: "GET",

                url:
                    "https://nominatim.openstreetmap.org/search",

                params: {

                    q: normalizedQuery,

                    format: "json",

                    limit: 5

                },

                headers: {

                    "User-Agent":
                        "saltstayz-destination-board"

                }

            });


        const result = {

            status: "ok",

            data:
                response.data.map(city => ({

                    name:
                        city.name,

                    lat:
                        Number(city.lat),

                    lon:
                        Number(city.lon),

                    display_name:
                        city.display_name

                }))

        };


        cache.set(
            cacheKey,
            result,
            CACHE_TTL.NOMINATIM
        );


        return result;

    });

}



module.exports = {
    searchCity
};