// Destination controller
// Handles HTTP request/response


const {
    getDestinations
} = require("../services/destination.service");



// GET /api/destinations
async function destinations(req,res){


    try{


        const cities =
            req.query.cities
            ?.split(",")
            .filter(Boolean)
            ||
            [];



        const result =
            await getDestinations(cities);



        res.json(result);


    }
    catch(error){


        res.status(500).json({

            error:"internal_server_error"

        });


    }


}



module.exports = {

    destinations

};