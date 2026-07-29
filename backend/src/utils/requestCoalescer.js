// Maps unique cache keys to their in-flight promises
const activeRequests = new Map();

/**
 * Coalesces identical concurrent requests into a single execution to prevent thundering herds.
 * If multiple requests ask for the same key, they will all await the same underlying promise.
 */
async function coalesce(key, asyncTaskFn) {
    // If there's already an active request for this key, hook onto its promise
    if (activeRequests.has(key)) {
        console.log(`[requestCoalescer] Hitching a ride on existing request for key: ${key}`);
        return activeRequests.get(key);
    }

    // Otherwise, start the task and save its promise so others can join
    const taskPromise = Promise.resolve().then(asyncTaskFn);
    activeRequests.set(key, taskPromise);
    console.log(`[requestCoalescer] Initializing new upstream request for key: ${key}`);

    try {
        // Wait for the upstream API call to finish
        return await taskPromise;
    } finally {
        // Cleanup the map once resolved so future requests fetch fresh data
        console.log(`[requestCoalescer] Cleaning up completed request for key: ${key}`);
        activeRequests.delete(key);
    }
}

module.exports = {
    coalesce
};
