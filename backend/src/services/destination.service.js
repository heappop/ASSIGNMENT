// Destination service
// Orchestrates all upstream clients and builds final response


const {
    searchCity
} = require("../clients/nominatim.client");


const {
    getWeather
} = require("../clients/weather.client");


const {
    getFx
} = require("../clients/fx.client");


const {
    getCountry
} = require("../clients/country.client");


const {
    getPoi
} = require("../clients/poi.client");


const {
    scoreWindows
} = require("../lib/score");

const {
    successBlock,
    errorBlock
} = require("../utils/blockResponse");



// Default currency mapping
// Assignment requires FX against INR
const DEFAULT_CURRENCY = "INR";



// Resolve city coordinates
async function resolveCity(query){


    const result =
        await searchCity(query);



    if(
        result.status !== "ok" ||
        !result.data.length
    ){

        return null;

    }



    const city =
        result.data[0];



    return {


        name:
        city.name
        ||
        query,


        country:
        city.country
        ||
        city.display_name
            ?.split(",")
            ?.pop()
            ?.trim()
        ||
        "Unknown",


        countryCode:
        (city.countryCode || "")
            .toUpperCase(),


        lat:
        Number(city.lat),


        lon:
        Number(city.lon)

    };


}



// Convert upstream result into block format
function createBlock(result){

    if(
        !result
        ||
        typeof result !== "object"
    ){

        return errorBlock({
            message: "invalid_upstream_result"
        });

    }


    if(
        result.status === "ok"
    ){

        return successBlock(result.data, {
            validAt:
            result.data?.validAt
            ||
            null
        });

    }


    return errorBlock({
        code:
        result.status === "timeout"
        ? "TIMEOUT"
        : null,
        message:
        result.error
        ||
        "upstream_error"
    });

}



async function callWithRetry(operation, retries = 1, delayMs = 200) {
    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            if (attempt === retries) {
                throw error;
            }

            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }

    throw lastError;
}


// Get destination information
async function getDestinations(
    cities
){


    const destinations = [];



    for(const query of cities){



        // Step 1: Resolve city
        const resolved =
            await resolveCity(query);



        if(!resolved){


            destinations.push({

                query,


                resolved:null,


                blocks:{

                    weather:{
                        status:"error",
                        error:"city_not_found",
                        data:null
                    }

                }

            });


            continue;

        }



        // Step 2:
        // Fetch independent upstreams together
        const countryPromise =
            resolved.countryCode
            ?
            callWithRetry(() => getCountry(resolved.countryCode), 1)
            :
            Promise.resolve({
                status:"ok",
                data:null
            });


        const [
            weatherResult,
            fxResult,
            countryResult,
            poiResult

        ] =
        await Promise.allSettled([



            callWithRetry(() => getWeather(
                resolved.lat,
                resolved.lon
            ), 1),



            callWithRetry(() => getFx(
                DEFAULT_CURRENCY
            ), 1),



            countryPromise,



            callWithRetry(() => getPoi(
                resolved.lat,
                resolved.lon
            ), 1)


        ]);



        // Extract fulfilled promises safely
        const weather =
            weatherResult.status === "fulfilled"
            ?
            weatherResult.value
            :
            {
                status:"error",
                error:
                weatherResult.reason?.message
                ||
                "upstream_error"
            };


        const fx =
            fxResult.status === "fulfilled"
            ?
            fxResult.value
            :
            {
                status:"error",
                error:
                fxResult.reason?.message
                ||
                "upstream_error"
            };


        const country =
            countryResult.status === "fulfilled"
            ?
            countryResult.value
            :
            {
                status:"error",
                error:
                countryResult.reason?.message
                ||
                "upstream_error"
            };


        const poi =
            poiResult.status === "fulfilled"
            ?
            poiResult.value
            :
            {
                status:"error",
                error:
                poiResult.reason?.message
                ||
                "upstream_error"
            };



        // Calculate best event window
        let bestWindow =
        {
            status:"error",
            data:null
        };



        if(
            weather.status==="ok"
        ){

            const scores =
                scoreWindows(
                    weather.data.days
                );



            bestWindow =
            {

                status:"ok",

                data:
                scores[0]
                ||
                null

            };

        }



        destinations.push({

            query,


            resolved,


            blocks:{


                weather:
                createBlock(weather),


                bestWindow,


                fx:
                createBlock(fx),


                country:
                createBlock(country),


                poi:
                createBlock(poi)

            }

        });


    }



    return {


        generatedAt:
        new Date().toISOString(),


        destinations

    };


}



module.exports = {

    getDestinations

};