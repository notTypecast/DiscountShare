import { promiseQuery } from "../util/query.js";

async function getShops() {
    let results;
    try {
        results = await promiseQuery("SELECT shop.*, COUNT(discount.id) AS discountCount FROM shop LEFT JOIN discount ON shop.id=discount.shop_id GROUP BY shop.id", null);
    } catch (err) {
        console.log(err);
        return err;
    }

    return results;
}

export {getShops};