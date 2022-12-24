import { promiseQuery } from "../util/query.js";

async function getDiscounts(shop_id) {
    let results = await promiseQuery(`SELECT discount.product_name, discount.username, discount.cost, (CASE WHEN price.cost IS NULL THEN 2
        WHEN discount.cost < 0.8*price.cost THEN 2
        WHEN discount.cost < 0.8*avg_price.avg_cost THEN 1
        ELSE 0 END) AS condition_value,
    COUNT(CASE WHEN rating='like' THEN 1 ELSE NULL END) AS likes, COUNT(CASE WHEN rating='dislike' THEN 1 ELSE NULL END) AS dislikes,
    posted, expiry, in_stock, image_link, total_review_score
    FROM discount 
    LEFT JOIN review ON discount.shop_id=review.shop_id AND discount.product_name=review.product_name
    LEFT JOIN (
        SELECT price.product_name, price.cost
        FROM price INNER JOIN (
            SELECT product_name, MAX(day_date) AS max_date
            FROM price
            GROUP BY product_name
        ) latest_price ON price.product_name=latest_price.product_name AND price.day_date=latest_price.max_date
    ) price ON discount.product_name=price.product_name
    LEFT JOIN (
        SELECT price.product_name, AVG(price.cost) AS avg_cost
        FROM price
        WHERE price.day_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY price.product_name
    ) avg_price ON discount.product_name=avg_price.product_name
    INNER JOIN product ON discount.product_name=product.name
    INNER JOIN user ON discount.username=user.username
    WHERE discount.shop_id=?
    GROUP BY discount.product_name, discount.username, discount.cost, condition_value, posted, expiry, in_stock, image_link, total_review_score`, shop_id);

    return results;
}

async function setInStock(shop_id, product_name, value) {
    let result = await promiseQuery("UPDATE discount SET in_stock=? WHERE shop_id=? AND product_name=?", [value, shop_id, product_name]);

    return null;
}

export { getDiscounts, setInStock };