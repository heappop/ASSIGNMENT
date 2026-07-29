// Client for OpenStreetMap Nominatim geocoding API


const { request } =
    require("../utils/upstream");


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



        if(
            response.status !== "ok"
        ){

            return response;

        }


        if(
            !Array.isArray(response.data)
        ){

            return {

                status: "error",

                error: "invalid_geocoding_response",

                data: null

            };

        }


        return {

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
                        city.display_name,

                    // ISO country code from Nominatim
                    countryCode:
                        city.address?.country_code
                            ?.toUpperCase()
                        ||
                        null,

                    country:
                        city.address?.country
                        ||
                        null

                }))

        };

    });


}



module.exports = {
    searchCity
};