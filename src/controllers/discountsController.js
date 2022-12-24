import { getDiscounts, setInStock } from "../models/discountModel.js";

async function discountsControllerGet(req, res) {
    let shop_id = req.query.shop_id;
    let results;

    try {
        results = await getDiscounts(shop_id);
    } catch (err) {
        console.log(err);
        return res.status(500).json({error: "Internal server error."});
    }

    return res.status(200).json(results);
}

async function discountsControllerPatch(req, res) {
    let in_stock = req.body.in_stock;
    let shop_id = req.body.shop_id;
    let product_name = req.body.product_name;

    try {
        await setInStock(shop_id, product_name, in_stock);
    } catch (err) {
        console.log(err);
        return res.status(500).json({error: "Internal server error."});
    }

    return res.status(200);
}

export { discountsControllerGet, discountsControllerPatch };