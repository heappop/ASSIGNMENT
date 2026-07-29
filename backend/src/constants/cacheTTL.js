// Cache duration configuration
// Different upstream data has different freshness requirements


module.exports = {


    // Coordinates rarely change
    NOMINATIM:
        30 * 24 * 60 * 60 * 1000,


    // Weather changes frequently
    WEATHER:
        15 * 60 * 1000,


    // Currency updates daily
    FX:
        24 * 60 * 60 * 1000,


    // Country metadata rarely changes
    COUNTRY:
        30 * 24 * 60 * 60 * 1000,


    // POI density changes slowly
    POI:
        6 * 60 * 60 * 1000
};