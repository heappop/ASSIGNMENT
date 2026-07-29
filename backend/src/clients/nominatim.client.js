// Client for OpenStreetMap Nominatim geocoding API


const { request } =
    require("../utils/upstream");
const cache = require("../cache/cache");

const CACHE_TTL = require("../constants/cacheTTL");


const {
    schedule
} = require("../cache/rateLimiter");



// Fetch city coordinates
async function searchCity(query) {


    // Nominatim must be globally rate limited
    return schedule(async () => {


        // Call upstream API
        const response =
            await request({

                method: "GET",

                url:
                    "https://nominatim.openstreetmap.org/search",

                params: {

                    q: query,

                    format: "json",

                    limit: 5

                },


                headers: {

                    // Required by Nominatim policy
                    "User-Agent":
                        "saltstayz-destination-board"

                }

            });

        // Cache key
        const cacheKey = `nominatim:${query.toLowerCase()}`;

        // Return cached response if available
        const cached = cache.get(cacheKey);

        if (cached) {
            return cached;
        }

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

        // Store in cache
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