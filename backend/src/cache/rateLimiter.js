// Global rate limiter for controlling upstream request frequency
// Used mainly for Nominatim API which allows only 1 request per second


// Store last execution timestamp
let lastExecutionTime = 0;


// Store pending requests waiting in queue
const queue = [];


// Statistics required for debug endpoint
const stats = {

    // Current waiting requests
    queued: 0,


    // Highest number of queued requests observed
    maxObservedQueue: 0,


    // Maximum requests executed per second
    maxObservedRatePerSecond: 0

};



// Delay helper function
function sleep(ms) {

    return new Promise(
        resolve => setTimeout(resolve, ms)
    );

}



// Execute tasks with global rate limit
async function schedule(task) {


    // Add task into queue
    queue.push(task);


    // Update queue statistics
    stats.queued = queue.length;


    stats.maxObservedQueue =
        Math.max(
            stats.maxObservedQueue,
            queue.length
        );



    // Process queue sequentially
    while (queue.length) {


        // Take first waiting task
        const nextTask =
            queue.shift();



        // Calculate time passed since last request
        const elapsed =
            Date.now() - lastExecutionTime;



        // Minimum interval required by Nominatim
        const waitTime =
            Math.max(
                0,
                1000 - elapsed
            );



        // Wait if previous request was recent
        if (waitTime > 0) {

            await sleep(waitTime);

        }



        // Execute upstream request
        const result =
            await nextTask();



        // Update last request time
        // Calculate actual execution rate
        const now = Date.now();


        const interval =
            now - lastExecutionTime;


        // Convert interval into requests per second
        if (interval > 0) {

            const currentRate =
                1000 / interval;


            stats.maxObservedRatePerSecond =
                Math.max(
                    stats.maxObservedRatePerSecond,
                    Number(currentRate.toFixed(1))
                );

        }


        // Update last execution timestamp
        lastExecutionTime = now;


        // Update queue count
        stats.queued =
            queue.length;



        return result;

    }

}



// Return limiter statistics
function getStats() {

    return {

        queued: stats.queued,


        maxObservedRatePerSecond:
            stats.maxObservedRatePerSecond

    };

}



module.exports = {

    schedule,

    getStats

};