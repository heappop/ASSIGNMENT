// Refresh controller

const { refreshCities } = require("../services/refresh.service");

async function refresh(req, res) {
    try {
        const cities =
            req.body?.cities
            ?.filter(Boolean)
            ||
            [];

        const result = await refreshCities(cities);

        res.json(result);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            status: "error",
            error: "refresh_failed",
            details: error.message || null
        });
    }
}

module.exports = {
    refresh
};
