// Debug routes


const express =
require("express");


const {
    getStats
}
=
require("../controllers/debug.controller");


const router =
express.Router();



router.get(
    "/debug/stats",
    getStats
);



module.exports = router;