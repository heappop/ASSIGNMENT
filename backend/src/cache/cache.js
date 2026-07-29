// Simple in-memory cache implementation
// Stores upstream responses with TTL support


// Internal cache storage
const store = new Map();


// Cache statistics required by /api/debug/stats
const stats = {

    // Number of successful cache retrievals
    hits: 0,

    // Number of cache misses
    misses: 0,

    // Current cache entries count
    entries: 0

};



// Save data into cache
function set(
    key,
    value,
    ttlMilliseconds
){

    // Store value with expiry timestamp
    store.set(
        key,
        {
            value,

            expiresAt:
                Date.now() + ttlMilliseconds
        }
    );


    // Update total cache entries
    stats.entries = store.size;

}



// Retrieve data from cache
function get(key){


    // Check whether key exists
    const cached = store.get(key);



    // Cache miss when key does not exist
    if(!cached){

        stats.misses++;

        return null;

    }



    // Remove expired cache data
    if(
        Date.now() > cached.expiresAt
    ){

        store.delete(key);

        stats.entries = store.size;

        stats.misses++;

        return null;

    }



    // Cache hit
    stats.hits++;


    return cached.value;

}



// Delete specific cache entry
function remove(key){

    store.delete(key);


    stats.entries = store.size;

}

// Delete all cache entries with the provided prefix
function removeByPrefix(prefix){
    for (const key of Array.from(store.keys())) {
        if (key.startsWith(prefix)) {
            store.delete(key);
        }
    }

    stats.entries = store.size;
}


// Clear entire cache
function clear(){

    store.clear();


    stats.entries = 0;

}



// Return cache statistics
function getStats(){

    return {

        hits: stats.hits,

        misses: stats.misses,

        entries: stats.entries

    };

}



module.exports = {

    set,

    get,

    remove,

    clear,

    getStats

};