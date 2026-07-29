// Shared helper for upstream API calls
// Handles timeout and consistent responses


const axios = require("axios");


// Default timeout for external services
const DEFAULT_TIMEOUT = 5000;



// Execute external request safely
async function request(config){


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