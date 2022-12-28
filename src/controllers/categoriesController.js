import { getCategories, getSubcategoriesByCategory } from "../models/categoryModel.js";

async function categoriesController(req, res) {
    let results;
    
    try {
        if (req.query.category_id === undefined) {
            results = await getCategories();
        }
        else {
            results = await getSubcategoriesByCategory(req.query.category_id);
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({error: "Internal server error."});
    }

    return res.status(200).json(results);
}

export {categoriesController};