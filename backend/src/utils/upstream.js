// Shared helper for upstream API calls
// Handles timeout and consistent responses


const axios = require("axios");


// Default timeout for external services
const DEFAULT_TIMEOUT = 5000;


function mockRequest(config){

    const url = config.url || "";


    if(
        process.env.MOCK_OVERPASS_FAIL === "1"
        &&
        url.includes("overpass")
    ){

        return Promise.reject({
            code: "upstream_timeout"
        });

    }


    if(
        url.includes("nominatim")
    ){

        return Promise.resolve({
            status: 200,
            data: require("../../fixtures/nominatim.json")
        });

    }


    if(
        url.includes("open-meteo")
    ){

        return Promise.resolve({
            status: 200,
            data: require("../../fixtures/openmeteo.json")
        });

    }


    if(
        url.includes("restcountries")
    ){

        return Promise.resolve({
            status: 200,
            data: require("../../fixtures/restcountries.json")
        });

    }


    if(
        url.includes("frankfurter")
    ){

        return Promise.resolve({
            status: 200,
            data: require("../../fixtures/frankfurter.json")
        });

    }


    if(
        url.includes("overpass")
    ){

        return Promise.resolve({
            status: 200,
            data: require("../../fixtures/overpass-success.json")
        });

    }


    return Promise.resolve({
        status: 200,
        data: {}
    });

}


// Execute external request safely
async function request(config){

    if(process.env.MOCK === "1"){

        return mockRequest(config);

    }


    try {


        const response =
            await axios({

                timeout:
                DEFAULT_TIMEOUT,


                validateStatus:
                () => true,


                ...config

            });



        // Handle non-success HTTP status
        if(
            response.status < 200 ||
            response.status >= 300
        ){

            return {

                status:"error",

                error:
                `upstream_status_${response.status}`,

                data:null

            };

        }



        return {

            status:"ok",

            data:
            response.data

        };


    }
    catch(error){


        return {


            status:
            error.code === "ECONNABORTED"
            ?
            "timeout"
            :
            "error",


            error:
            error.message,


            data:null

        };


    }

}



module.exports = {

    request

};