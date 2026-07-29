// Client for REST Countries API
// Retrieves country metadata using country code


const {
    request
} = require("../utils/upstream");



// Fetch country details by ISO country code
async function getCountry(countryCode){


    // Call REST Countries upstream API
    const response =
        await request({

            method:"GET",

            url:
            `https://restcountries.com/v3.1/alpha/${countryCode}`

        });



    // Upstream request failed
    if(response.status !== "ok"){

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
    if(
        Array.isArray(response.data)
        &&
        response.data.length > 0
    ){

        country =
            response.data[0];

    }



    // Handle object response
    else if(
        response.data?.name
    ){

        country =
            response.data;

    }



    // Unknown upstream response
    if(!country){

        return {

            status:"error",

            error:
            "invalid_country_response",

            data:null

        };

    }



    // Normalize application response
    return {


        status:"ok",


        data:{


            name:
            country.name?.common
            ||
            null,


            currency:
            Object.keys(
                country.currencies || {}
            )[0]
            ||
            null,


            region:
            country.region
            ||
            null

        }


    };


}



module.exports = {

    getCountry

};