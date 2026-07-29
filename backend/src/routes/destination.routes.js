// Destination routes


const express =
require("express");


const {
    destinations
} =
require("../controllers/destination.controller");



const router =
express.Router();



router.get(
    "/destinations",
    destinations
);



module.exports =
router;