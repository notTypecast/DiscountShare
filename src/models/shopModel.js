import { promiseQuery } from "../util/query.js";

async function getShops(category_id) {
    let results;
    try {
        if (category_id === undefined) {
            results = await promiseQuery("SELECT shop.*, COUNT(discount.id) AS discountCount FROM shop LEFT JOIN discount ON shop.id=discount.shop_id GROUP BY shop.id", null);
        }
        else {
            results = await promiseQuery("SELECT shop.*, COUNT(discount.id) AS discountCount FROM shop LEFT JOIN discount ON shop.id=discount.shop_id INNER JOIN product ON discount.product_name=product.name INNER JOIN category ON product.category_id=category.id WHERE category.id=? GROUP BY shop.id HAVING discountCount > 0", category_id);
        }
    } catch (err) {
        return err;
    }
    return results;
}

export {getShops};