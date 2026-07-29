// Client for REST Countries API
// Retrieves country metadata using country code


const {
    request
} = require("../utils/upstream");
const cache = require("../cache/cache");

const CACHE_TTL = require("../constants/cacheTTL");
const stats =
    require("../lib/stats");

const pendingRequests = new Map();



// Fetch country details by ISO country code
async function getCountry(countryCode) {


    const normalizedCountryCode =
        countryCode.trim().toUpperCase();


    const cacheKey =
        `country:${normalizedCountryCode}`;


    const cached =
        cache.get(cacheKey);


    if (cached) {

        return cached;

    }


    // Check if same request already running
    if (pendingRequests.has(cacheKey)) {

        return pendingRequests.get(cacheKey);

    }


    const requestPromise = (async () => {


        stats.increment("restcountries");


        const response =
            await request({

                method: "GET",

                url:
                    `https://restcountries.com/v3.1/alpha/${normalizedCountryCode}`

            });


        if (response.status !== "ok") {

            return response;

        }


        let country = null;


        if (
            Array.isArray(response.data)
            &&
            response.data.length > 0
        ) {

            country = response.data[0];

        }


        else if (response.data?.name) {

            country = response.data;

        }


        if (!country) {

            return {

                status: "error",

                error: "invalid_country_response",

                data: null

            };

        }



        const result = {

            status: "ok",

            data: {

                name:
                    country.name?.common,


                currency:
                    Object.keys(
                        country.currencies || {}
                    )[0] || null,


                region:
                    country.region

            }

        };


        cache.set(
            cacheKey,
            result,
            CACHE_TTL.COUNTRY
        );


        return result;


    })();



    pendingRequests.set(
        cacheKey,
        requestPromise
    );


    try {

        return await requestPromise;

    }

    finally {

        pendingRequests.delete(cacheKey);

    }

}



module.exports = {

    getCountry

};