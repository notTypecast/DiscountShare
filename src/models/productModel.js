import fs from "fs/promises";
import { promiseQuery } from '../util/query.js';

async function updateProductsFromFile(filepath) {
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

export { updateProductsFromFile };