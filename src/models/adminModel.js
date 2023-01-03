import { promiseQuery } from "../util/query.js";

async function deleteProducts() {
    await promiseQuery("DELETE FROM product", null);

    return null;
}

async function deletePOIs() {
    await promiseQuery("DELETE FROM shop", null);
}

export { deleteProducts, deletePOIs };