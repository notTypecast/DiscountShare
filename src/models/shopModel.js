import { promiseQuery } from "../util/query.js";

async function getShops(category_id) {
    let results;
    if (category_id === undefined) {
        results = await promiseQuery("SELECT shop.*, COUNT(DISTINCT discount.shop_id, discount.product_name) AS discountCount FROM shop LEFT JOIN discount ON shop.id=discount.shop_id GROUP BY shop.id", null);
    }
    else {
        results = await promiseQuery("SELECT shop.*, COUNT(DISTINCT discount.shop_id, discount.product_name) AS discountCount FROM shop LEFT JOIN discount ON shop.id=discount.shop_id INNER JOIN product ON discount.product_name=product.name INNER JOIN category ON product.category_id=category.id WHERE category.id=? GROUP BY shop.id HAVING discountCount > 0", category_id);
    }

    return results;
}

async function getShopLocation(shop_id) {
    let result = await promiseQuery("SELECT latitude, longitude FROM shop WHERE id=?", shop_id);
    return result;
}

export {getShops, getShopLocation};