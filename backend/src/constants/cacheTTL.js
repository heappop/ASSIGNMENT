// Cache duration configuration
// Different upstream data has different freshness requirements


module.exports = {


    // Coordinates rarely change (7 days)
    NOMINATIM:
        7 * 24 * 60 * 60 * 1000,


    // Weather changes frequently (60 minutes)
    WEATHER:
        60 * 60 * 1000,


    // Currency updates daily
    FX:
        24 * 60 * 60 * 1000,


    // Country metadata rarely changes (30 days)
    COUNTRY:
        30 * 24 * 60 * 60 * 1000,


    // POI density changes slowly (24 hours)
    POI:
        24 * 60 * 60 * 1000
};