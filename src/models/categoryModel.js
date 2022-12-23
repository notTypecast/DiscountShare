import { promiseQuery } from "../util/query.js";

async function getCategories() {
    let results;
    try {
        results = await promiseQuery("SELECT * FROM category");
    } catch (err) {
        return err;
    }

    return results;
}

export { getCategories };