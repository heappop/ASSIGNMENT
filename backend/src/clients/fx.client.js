// Client for Frankfurter currency exchange API
// Fetches currency conversion rates against INR


const {
    request
} = require("../utils/upstream");



// Get currency exchange rate
async function getFx(currency){


    // INR does not need external conversion
    if(currency === "IN"){

        return {

            status:"ok",

            data:{

                currency:"INR",

                rateToInr:1

            }

        };

    }



    // Call Frankfurter API
    const response =
        await request({

            method:"GET",

            url:
            "https://api.frankfurter.app/latest",

            params:{

                from:currency,

                to:"INR"

            }

        });



    if(response.status !== "ok"){

        return response;

    }



    return {


        status:"ok",


        data:{

            currency,


            rateToInr:
            response.data.rates.INR

        }


    };


}



module.exports = {

    getFx

};