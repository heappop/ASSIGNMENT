// Refresh service

const cache = require("../cache/cache");

async function refreshCities(cities) {
    const refreshed = [];

    for (const city of cities) {
        const cityKey = String(city || "").trim();

        if (!cityKey) {
            continue;
        }

        const invalidated = ["weather", "fx", "poi"];

        const cacheKeys = [
            `weather:${cityKey}`,
            `fx:${cityKey}`,
            `poi:${cityKey}`
        ];

        cacheKeys.forEach((cacheKey) => {
            cache.remove(cacheKey);
        });

        refreshed.push({
            city: cityKey,
            invalidated,
            removedCacheKeys: cacheKeys
        });
    }

    return {
        status: "ok",
        data: refreshed
    };
}

module.exports = {
    refreshCities
};
