import { promiseQuery } from "../util/query.js";

async function getDiscounts(shop_id, username) {
    let results = await promiseQuery(`SELECT discount.product_name, discount.username, discount.cost, (CASE WHEN price.cost IS NULL THEN 2
        WHEN discount.cost < 0.8*price.cost THEN 2
        WHEN discount.cost < 0.8*avg_price.avg_cost THEN 1
        ELSE 0 END) AS condition_value,
    COUNT(CASE WHEN review.rating='like' THEN 1 ELSE NULL END) AS likes, COUNT(CASE WHEN review.rating='dislike' THEN 1 ELSE NULL END) AS dislikes,
    r_usr.rating AS current_rating,
    posted, expiry, in_stock, image_link, (CASE WHEN total_review_score >= 0 THEN total_review_score ELSE 0 END) as total_review_score
    FROM discount 
    LEFT JOIN review ON discount.shop_id=review.shop_id AND discount.product_name=review.product_name
    LEFT JOIN (
        SELECT rating, shop_id, product_name
        FROM review 
        WHERE username=?
    ) as r_usr ON discount.shop_id=r_usr.shop_id AND discount.product_name=r_usr.product_name
    LEFT JOIN (
        SELECT price.product_name, price.cost
        FROM price INNER JOIN (
            SELECT product_name, MAX(day_date) AS max_date
            FROM price
            WHERE day_date <> CURDATE()
            GROUP BY product_name
        ) latest_price ON price.product_name=latest_price.product_name AND price.day_date=latest_price.max_date
    ) price ON discount.product_name=price.product_name
    LEFT JOIN (
        SELECT price.product_name, AVG(price.cost) AS avg_cost
        FROM price
        WHERE price.day_date >= DATE_SUB(CURDATE(), INTERVAL 8 DAY) AND price.day_date <> CURDATE()
        GROUP BY price.product_name
    ) avg_price ON discount.product_name=avg_price.product_name
    INNER JOIN product ON discount.product_name=product.name
    INNER JOIN user ON discount.username=user.username
    WHERE discount.shop_id=?
    GROUP BY discount.product_name, discount.username, discount.cost, condition_value, current_rating, posted, expiry, in_stock, image_link, total_review_score
    ORDER BY condition_value DESC, expiry DESC`, [username, shop_id]);

    return results;
}

async function addDiscount(shop_id, product_name, cost, username) {
    await promiseQuery("INSERT INTO discount(shop_id, product_name, cost, username, posted, expiry) VALUES (?, ?, ?, ?, NOW(), NOW() + INTERVAL 1 WEEK) ON DUPLICATE KEY UPDATE cost=VALUES(cost), username=VALUES(username), posted=VALUES(posted), expiry=VALUES(expiry), in_stock=1", [shop_id, product_name, cost, username]);

    let result = await promiseQuery("SELECT @discount_condition_value AS condition_value", null);

    return result[0];
}

async function setInStock(shop_id, product_name, value) {
    await promiseQuery("UPDATE discount SET in_stock=? WHERE shop_id=? AND product_name=?", [value, shop_id, product_name]);

    return null;
}

async function setRating(username, shop_id, product_name, rating) {
    await promiseQuery("INSERT INTO review(username, shop_id, product_name, rating) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE rating=VALUES(rating)", [username, shop_id, product_name, rating]);

    return null;
}

async function removeRating(username, shop_id, product_name) {
    await promiseQuery("DELETE FROM review WHERE username=? AND shop_id=? AND product_name=?", [username, shop_id, product_name]);

    return null;
}

export { getDiscounts, addDiscount, setInStock, setRating, removeRating };