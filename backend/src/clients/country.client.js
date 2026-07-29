// Client for REST Countries API
// Retrieves country metadata using country code


const {
    request
} = require("../utils/upstream");
const cache = require("../cache/cache");

const CACHE_TTL = require("../constants/cacheTTL");



// Fetch country details by ISO country code
async function getCountry(countryCode) {

    const cacheKey =
        `country:${countryCode}`;

    const cached =
        cache.get(cacheKey);

    if (cached) {

        return cached;

    }


    // Call REST Countries upstream API
    const response =
        await request({

            method: "GET",

            url:
                `https://restcountries.com/v3.1/alpha/${countryCode}`

        });



    // Upstream request failed
    if (response.status !== "ok") {

        return response;

    }



    /*
      REST Countries has returned different
      response shapes during API migration.

      Expected:
      [
        {
          name:{common:"India"}
        }
      ]

      Deprecated:
      {
        success:false,
        errors:[]
      }
    */



    let country = null;



    // Handle normal array response
    if (
        Array.isArray(response.data)
        &&
        response.data.length > 0
    ) {

        country =
            response.data[0];

    }



    // Handle object response
    else if (
        response.data?.name
    ) {

        country =
            response.data;

    }



    // Unknown upstream response
    if (!country) {

        return {

            status: "error",

            error:
                "invalid_country_response",

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


}



module.exports = {

    getCountry

};