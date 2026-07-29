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

        return {
            status:"error",
            error:"invalid_upstream_result",
            data:null
        };

    }


    if(
        result.status === "ok"
    ){

        return {

            status:"ok",

            fetchedAt:
            new Date().toISOString(),

            validAt:
            result.data?.validAt
            ||
            null,

            stale:false,

            data:
            result.data

        };

    }



    return {

        status:
        result.status
        ||
        "error",

        error:
        result.error
        ||
        "upstream_error",

        data:null

    };


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
            getCountry(resolved.countryCode)
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



            getWeather(
                resolved.lat,
                resolved.lon
            ),



            getFx(
                DEFAULT_CURRENCY
            ),



            countryPromise,



            getPoi(
                resolved.lat,
                resolved.lon
            )


        ]);



        // Extract fulfilled promises safely
        const weather =
            weatherResult.value
            ||
            {
                status:"error"
            };


        const fx =
            fxResult.value
            ||
            {
                status:"error"
            };


        const country =
            countryResult.value
            ||
            {
                status:"error"
            };


        const poi =
            poiResult.value
            ||
            {
                status:"error"
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