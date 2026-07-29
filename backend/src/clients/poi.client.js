// Client for Overpass API
// Counts nearby amenities around a location


const {
    request
} = require("../utils/upstream");

const cache = require("../cache/cache");

const CACHE_TTL = require("../constants/cacheTTL");



// Fetch nearby point of interest count
async function getPoi(
    latitude,
    longitude
) {


    const cacheKey =
        `poi:${latitude}:${longitude}`;

    const cached =
        cache.get(cacheKey);

    if (cached) {

        return cached;

    }

    // Overpass query
    const query =
        `
[out:json][timeout:20];
node(around:2000,${latitude},${longitude})[amenity];
out count;
`;



    // Call Overpass API
    // Call Overpass API
    const response =
        await request({

            method: "POST",

            url:
                "https://overpass-api.de/api/interpreter",


            // Convert query into form encoded string
            data:
                new URLSearchParams({

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



    // Extract count safely
    const count =
        response.data
            ?.elements?.[0]
            ?.tags
            ?.nodes
        ??
        0;



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


}



module.exports = {

    getPoi

};