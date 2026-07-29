// Application runtime statistics
// Used by /api/debug/stats


const upstreamCalls = {

    nominatim:0,

    openmeteo:0,

    frankfurter:0,

    restcountries:0,

    overpass:0

};


// Increment upstream counter
function increment(source){

    if(upstreamCalls[source] !== undefined){

        upstreamCalls[source]++;

    }

}


// Return counters
function getUpstreamCalls(){

    return {

        ...upstreamCalls

    };

}



module.exports = {

    increment,

    getUpstreamCalls

};