import { getProducts } from "../models/productModel.js";

async function productsController(req, res) {
    let results;
    
    try {
        results = await getProducts(req.query.search_term, req.query.category_id, req.query.subcategory_id);
    } catch (err) {
        console.log(err);
        return res.status(500).json({error: "Internal server error."});
    }

    return res.status(200).json(results);
}

export {productsController};