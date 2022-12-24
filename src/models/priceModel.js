import fs from "fs/promises";
import { promiseQuery } from "../util/query.js";

async function updatePricesFromFile(filepath) {
    let data = await fs.readFile(filepath);
    const jsonData = JSON.parse(data);

    const prices_sql = "INSERT INTO price(product_name, day_date, cost) VALUES ? ON DUPLICATE KEY UPDATE day_date = VALUES(day_date), cost = VALUES(cost)";
    const price_data = [];

    for (let product of jsonData.data) {
        for (let date_obj of product.prices) {
            price_data.push([product.name, date_obj.date, date_obj.price]);
        }
    }

    await promiseQuery(prices_sql, [price_data]);
}

export {updatePricesFromFile};