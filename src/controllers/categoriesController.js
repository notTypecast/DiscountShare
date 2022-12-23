import { getCategories } from "../models/categoryModel.js";

async function categoriesController(req, res) {
    let results;
    
    try {
        results = await getCategories();
    } catch (err) {
        console.log(err);
        return res.status(500).json({error: "Internal server error."});
    }

    return res.status(200).json(results);
}


export {categoriesController};