import { promiseQuery } from "../util/query.js";

async function changeUserDetails(username, new_username, new_pwd) {
    let u = new_username !== undefined;
    let p = new_pwd !== undefined;
    
    let query = "UPDATE user SET last_updated=(UNIX_TIMESTAMP()) AND ";
    let args = [];

    if (u) {
        query += "username=? ";
        args.push(new_username);

        if (p) {
            query += "AND ";
        }
    }

    if (p) {
        query += "hash=? ";
        args.push(new_pwd);
    }

    query += " WHERE username=?";
    args.push(username);

    await promiseQuery(query, args);

    let result = await promiseQuery("SELECT is_admin FROM user WHERE username=?", u ? new_username : username);

    return result[0].is_admin;
}

async function insertUser(username, pwd, email) {
    await promiseQuery("INSERT INTO user (username, hash, email) VALUES (?, ?, ?)", [username, pwd, email]);

    return null;
}

async function getUser(username) {
    let results = await promiseQuery("SELECT * FROM user WHERE username = ?", [username]);
    
    return results;
}

async function getUserDiscountHistory(username) {
    let results = await promiseQuery(`SELECT name, shop_id, product_name, cost, posted, expiry, likes, dislikes, 1 as expired
    FROM expired_discount
    LEFT JOIN shop ON expired_discount.shop_id=shop.id
    WHERE username=?
    UNION
    SELECT name, discount.shop_id, discount.product_name, cost, posted, expiry,
    COUNT(CASE WHEN review.rating='like' THEN 1 ELSE NULL END) AS likes, COUNT(CASE WHEN review.rating='dislike' THEN 1 ELSE NULL END) AS dislikes,
    0 as expired
    FROM discount
    LEFT JOIN shop ON discount.shop_id=shop.id
    LEFT JOIN review ON discount.shop_id=review.shop_id AND discount.product_name=review.product_name
    WHERE discount.username=?
    GROUP BY discount.shop_id, discount.product_name, cost, posted, expiry, expired`, [username, username]);

    return results;
}

async function getUserReviewHistory(username) {
    let results = await promiseQuery(`SELECT rating, name, shop_id, product_name, cost, expired_discount.username, posted, expiry, 1 as expired
    FROM expired_review
    INNER JOIN expired_discount ON expired_discount_id=discount_id
    LEFT JOIN shop ON expired_discount.shop_id=shop.id
    WHERE expired_review.username=?
    UNION
    SELECT rating, name, discount.shop_id, discount.product_name, cost, discount.username, posted, expiry, 0 as expired
    FROM review
    INNER JOIN discount ON discount.shop_id=review.shop_id AND discount.product_name=review.product_name
    LEFT JOIN shop ON discount.shop_id=shop.id
    WHERE review.username=?`, [username, username]);

    return results;
}

async function getUserScoreData(username) {
    let results = await promiseQuery("SELECT email, tokens, total_tokens, review_score, (CASE WHEN total_review_score >= 0 THEN total_review_score ELSE 0 END) as total_review_score FROM user WHERE username=?", username);

    return results[0];
}

async function getUserLastUpdated(username) {
    let result = await promiseQuery("SELECT last_updated FROM user WHERE username=?", username);

    return result[0].last_updated;
}

export {insertUser, getUser, changeUserDetails, getUserDiscountHistory, getUserReviewHistory, getUserScoreData, getUserLastUpdated};