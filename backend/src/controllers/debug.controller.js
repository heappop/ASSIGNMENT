// Debug endpoints controller


const cache =
require("../cache/cache");


const stats =
require("../lib/stats");



// GET /api/debug/stats
function getStats(req,res){


    res.json({

        upstreamCalls:
            stats.getUpstreamCalls(),


        cache:
            cache.getStats(),


        rateLimiter:{

            nominatim:{

                queued:0,

                maxObservedRatePerSecond:1

            }

        }

    });


}



module.exports = {

    getStats

};