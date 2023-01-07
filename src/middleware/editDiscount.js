import { distanceBetween } from "../util/distance.js";
import { getShopLocation } from "../models/shopModel.js";

async function editDiscount(req, res, next) {
    let latitude = req.body.latitude;
    let longitude = req.body.longitude;
    let shop_id = req.body.shop_id;
    let shop_location;


    try {
        shop_location = await getShopLocation(shop_id);
    } catch (err) {
        return res.status(400).json({error: "Shop not found."});
    }


    if (!global.DEBUG_EDIT_DISCOUNTS && distanceBetween(latitude, longitude, shop_location[0].latitude, shop_location[0].longitude) >= 50) {
        return res.status(403).json({error: "Cannot edit discounts for store."});
    }

    next();

}

export {editDiscount};