// Client for Frankfurter currency exchange API
// Fetches currency conversion rates against INR


const {
    request
} = require("../utils/upstream");

const cache = require("../cache/cache");

const CACHE_TTL = require("../constants/cacheTTL");
const stats =
    require("../lib/stats");


// Get currency exchange rate
async function getFx(currency) {

    const cacheKey =
        `fx:${currency}`;

    const cached =
        cache.get(cacheKey);

    if (cached) {

        return cached;

    }


    // INR does not need external conversion
    if (currency === "IN") {

        return {

            status: "ok",

            data: {

                currency: "INR",

                rateToInr: 1

            }

        };

    }

    stats.increment("frankfurter");

    // Call Frankfurter API
    const response =
        await request({

            method: "GET",

            url:
                "https://api.frankfurter.app/latest",

            params: {

                from: currency,

                to: "INR"

            }

        });



    if (response.status !== "ok") {

        return response;

    }


    const result = {

        status: "ok",

        data: {

            currency,

            rateToInr,

            validAt:
                response.data.date

        }

    };

    cache.set(

        cacheKey,

        result,

        CACHE_TTL.FX

    );

    return result;

}



module.exports = {

    getFx

};