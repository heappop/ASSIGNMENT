// Destination routes


const express =
require("express");


const {
    destinations
} =
require("../controllers/destination.controller");

const {
    refresh
} = require("../controllers/refresh.controller");



const router =
express.Router();



router.get(
    "/destinations",
    destinations
);

router.post(
    "/refresh",
    refresh
);



module.exports =
router;