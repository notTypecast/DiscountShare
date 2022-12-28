import { getDiscounts, addDiscount, setInStock, setRating, removeRating } from "../models/discountModel.js";

async function discountsControllerGet(req, res) {
    let shop_id = req.query.shop_id;
    let username = res.locals.user_data.username;
    let results;
    try {
        results = await getDiscounts(shop_id, username);
    } catch (err) {
        console.log(err);
        return res.status(500).json({error: "Internal server error."});
    }

    return res.status(200).json(results);
}

async function discountsControllerPost(req, res) {
    let shop_id = req.body.shop_id;
    let product_name = req.body.product_name;
    let cost = req.body.cost;
    let username = res.locals.user_data.username;
    let results;
    try {
        results = await addDiscount(shop_id, product_name, cost, username);
    } catch (err) {
        if (err.sqlState === "45001") {
            return res.status(403).json({error: "Similar discount already exists for product in this store."})
        }
    }

    return res.status(200).end();

}

async function discountsControllerPatch(req, res) {
    let shop_id = req.body.shop_id;
    let product_name = req.body.product_name;
    let in_stock = req.body.in_stock;
    let rating = req.body.rating;
    let username = res.locals.user_data.username;

    if (in_stock !== undefined) {
        try {
            await setInStock(shop_id, product_name, in_stock);
        } catch (err) {
            console.log(err);
            return res.status(500).json({error: "Internal server error."});
        }
    }
    else if (rating !== undefined) {
        if (rating === "none") {
            try {
                await removeRating(username, shop_id, product_name);
            } catch (err) {
                console.log(err);
                return res.status(500).json({error: "Internal server error."});
            }
        }
        else {
            try {
                await setRating(username, shop_id, product_name, rating);
            } catch (err) {
                if (err.sqlState === '45000') {
                    return res.status(403).json({error: "Cannot rate own post."});
                }
                console.log(err);
                return res.status(500).json({error: "Internal server error."});
            }
        }
    }
    else {
        return res.status(400).json({error: "Invalid request, expected 'in_stock' or 'rating'."})
    }

    return res.status(200).end();
}

export { discountsControllerGet, discountsControllerPost, discountsControllerPatch };