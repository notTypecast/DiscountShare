import { getShops } from "../models/shopModel.js";
import { distanceBetween } from "../util/distance.js";

async function shopsController(req, res) {
    let user_lat = req.query.latitude;
    let user_long = req.query.longitude;

    let results;
    
    try {
        results = await getShops(req.query.category_id);
    } catch (err) {
        console.log(err);
        return res.status(500).json({error: "Internal server error."});
    }

    for (let row of results) {
        if (distanceBetween(user_lat, user_long, row.latitude, row.longitude) < 50000) { // TODO: 50 HERE
            row.allowOffers = true;
        }
        else {
            row.allowOffers = false;
        }
    }

    return res.status(200).json(results);
}


export {shopsController};