import { promiseQuery } from "../util/query.js";

async function getCategories() {
    let results = await promiseQuery("SELECT * FROM category");

    return results;
}

export { getCategories };