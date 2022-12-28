import { promiseQuery } from "../util/query.js";

async function getCategories() {
    let results = await promiseQuery("SELECT * FROM category");

    return results;
}

async function getSubcategoriesByCategory(category_id) {
    let results = await promiseQuery("SELECT * FROM subcategory WHERE category_id=?", category_id);

    return results;
}

export { getCategories, getSubcategoriesByCategory };