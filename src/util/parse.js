import fs from "fs/promises";
import { promiseQuery } from "./query.js";

async function updateProducts(filepath) {
    let data = await fs.readFile(filepath);
    const jsonData = JSON.parse(data);
    
    const categories_sql = "INSERT INTO category(id, name) VALUES ? ON DUPLICATE KEY UPDATE name = VALUES(name)";
    const category_data = jsonData.categories.map(category => [category.uuid, category.name]);

    const subcategories_sql = "INSERT INTO subcategory(id, name, category_id) VALUES ? ON DUPLICATE KEY UPDATE name = VALUES(name), category_id = VALUES(category_id)";
    const subcategory_data = [];
    
    for (let category of jsonData.categories) {
        for (let subcategory of category.sub_categories) {
            subcategory_data.push([subcategory.uuid, subcategory.name, category.uuid]);
        }
    }

    const products_sql = "INSERT INTO product(name, image_link, category_id, subcategory_id) VALUES ? ON DUPLICATE KEY UPDATE \
    image_link = VALUES(image_link), category_id = VALUES(category_id), subcategory_id = VALUES(subcategory_id)";
    const product_data = jsonData.products.map(product => [product.name, product.image, product.category, product.subcategory]);

    await promiseQuery(categories_sql, [category_data]);
    await promiseQuery(subcategories_sql, [subcategory_data]);
    await promiseQuery(products_sql, [product_data]);
}

async function updatePrices(filepath) {
    let data = await fs.readFile(filepath);
    const jsonData = JSON.parse(data);

    const prices_sql = "INSERT INTO price(product_name, day_date, price) VALUES ? ON DUPLICATE KEY UPDATE day_date = VALUES(day_date), price = VALUES(price)";
    const price_data = [];

    for (let product of jsonData.data) {
        for (let date_obj of product.prices) {
            price_data.push([product.name, date_obj.date, date_obj.price]);
        }
    }

    await promiseQuery(prices_sql, [price_data]);
}

async function updatePOIs(filepath) {
    let data = await fs.readFile(filepath);
    const jsonData = JSON.parse(data);

    const POIs_sql = "INSERT INTO shop(id, shop_type, latitude, longitude, name, website, brand, phone_number) VALUES ? ON DUPLICATE KEY UPDATE \
    shop_type = VALUES(shop_type), name = VALUES(name), website = VALUES(website), brand = VALUES(brand), phone_number = VALUES(phone_number)";
    const POI_data = jsonData.features.map(feature => [feature.properties["@id"], feature.properties.shop, 
        feature.geometry.coordinates[1], feature.geometry.coordinates[0], feature.properties.name, feature.properties.website,
        feature.properties.brand, feature.properties.phone]);

    await promiseQuery(POIs_sql, [POI_data]);
}

export { updateProducts, updatePrices, updatePOIs};