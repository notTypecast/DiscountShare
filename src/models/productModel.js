import fs from "fs/promises";
import { promiseQuery } from '../util/query.js';

async function getProducts(search_term, category_id, subcategory_id) {
    let st = search_term !== undefined;
    let c = category_id !== undefined;
    let s = subcategory_id !== undefined;

    let query = "SELECT * FROM product WHERE ";
    let args = [];

    if (st) {
        query += "name LIKE ? ";
        args.push("%" + search_term + "%");
        if (c || s) {
            query += "AND ";
        }
    }

    if (c) {
        query += "category_id=? ";
        args.push(category_id);
        if (s) {
            query += "AND ";
        }
    }

    if (s) {
        query += "subcategory_id=?";
        args.push(subcategory_id);
    }

    let results = await promiseQuery(query, args);

    return results;
}

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

export { updateProductsFromFile, getProducts };