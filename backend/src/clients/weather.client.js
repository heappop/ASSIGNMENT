// Client for Open-Meteo weather forecast API
// Fetches 14-day forecast data required for event scoring


const {
    request
} = require("../utils/upstream");

const cache = require("../cache/cache");

const CACHE_TTL = require("../constants/cacheTTL");

// Fetch weather forecast using coordinates
async function getWeather(
    latitude,
    longitude
) {

    // Weather cache key
    const cacheKey =
        `weather:${latitude}:${longitude}`;

    // Return cached forecast
    const cached = cache.get(cacheKey);

    if (cached) {
        return cached;
    }


    // Call Open-Meteo upstream API
    const response =
        await request({

            method: "GET",

            url:
                "https://api.open-meteo.com/v1/forecast",


            params: {


                latitude,


                longitude,


                daily:
                    "temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",


                forecast_days: 14,


                timezone: "auto"

            }

        });



    // Convert upstream response into our application format
    if (
        response.status !== "ok"
    ) {

        return response;

    }



    const daily =
        response.data.daily;



    const days =
        daily.time.map(
            (date, index) => {


                return {


                    // Forecast date
                    date,


                    // Maximum temperature
                    tempMax:
                        daily.temperature_2m_max[index]
                        ??
                        null,


                    // Minimum temperature
                    tempMin:
                        daily.temperature_2m_min[index]
                        ??
                        null,


                    // Rain probability
                    precipProbability:
                        daily.precipitation_probability_max[index]
                        ??
                        null,


                    // Wind speed
                    windMax:
                        daily.wind_speed_10m_max[index]
                        ??
                        null


                };


            }
        );


    const result = {

        status: "ok",

        data: {

            days,

            validAt:
                response.data.daily.time[0]

        }

    };

    cache.set(

        cacheKey,

        result,

        CACHE_TTL.WEATHER

    );

    return result;

}



module.exports = {

    getWeather

};