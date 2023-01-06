import { promiseQuery } from "../util/query.js";

const USERS_PER_PAGE = 10;

async function deleteProducts() {
    await promiseQuery("DELETE FROM product", null);

    return null;
}

async function deletePOIs() {
    await promiseQuery("DELETE FROM shop", null);
}

async function deleteDiscount(shop_id, product_name) {
    await promiseQuery("DELETE FROM discount WHERE shop_id=? AND product_name=?", [shop_id, product_name]);

    return null;
}

async function getDiscountNumberByMonth(year, month_number) {
    let results = await promiseQuery(`SELECT COUNT(*) AS total_discounts, DAY(posted) as day
    FROM (
        SELECT posted
        FROM discount
        UNION ALL
        SELECT posted
        FROM expired_discount
    ) as t
    WHERE YEAR(posted)=? AND MONTH(posted)=?
    GROUP BY DAY(posted)`, [year, month_number]);

    return results;
}

async function getWeeklyDiscountData(start_date, category_id, subcategory_id) {
    let query = `SELECT p_date, COALESCE(AVG(CASE WHEN d.cost < p.avg_cost THEN 1 - d.cost/p.avg_cost ELSE NULL END)*100, 0) AS day_avg
    FROM (
        SELECT product_name, cost, DATE(posted) AS p_date
        FROM discount
        UNION ALL
        SELECT product_name, cost, DATE(posted) AS p_date
        FROM expired_discount
    ) AS d INNER JOIN (
        SELECT product_name, AVG(cost) AS avg_cost
        FROM price
        WHERE day_date >= ? AND day_date < DATE_ADD(?, INTERVAL 7 DAY)
        GROUP BY product_name
    ) AS p ON d.product_name=p.product_name
    INNER JOIN product ON d.product_name=product.name
    WHERE category_id=? `;
    let args = [start_date, start_date, category_id];

    if (subcategory_id !== undefined) {
        query += " AND subcategory_id=? ";
        args.push(subcategory_id);
    }

    query += "GROUP BY d.p_date HAVING d.p_date >= ? AND d.p_date < DATE_ADD(?, INTERVAL 7 DAY)";
    args = args.concat([start_date, start_date]);

    let results = await promiseQuery(query, args);

    return results;
}

async function getLeaderboardData(page) {
    let limit_start = 0;
    if (page > 0) {
        limit_start = USERS_PER_PAGE*page;
    }

    let results = await promiseQuery(`SELECT username, (CASE WHEN total_review_score < 0 THEN 0 ELSE total_review_score END) as total_score, review_score, total_tokens, email, is_admin
    FROM user
    ORDER BY total_review_score DESC
    LIMIT ?, ?`, [limit_start, USERS_PER_PAGE]);

    let total_users = (await promiseQuery("SELECT COUNT(*) as total FROM user"))[0].total;
    let total_pages = Math.ceil(total_users / USERS_PER_PAGE);

    return {
        total_pages: total_pages,
        page_users: results
    };
}

export { deleteProducts, deletePOIs, deleteDiscount, getDiscountNumberByMonth, getWeeklyDiscountData, getLeaderboardData };