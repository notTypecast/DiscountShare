import {  } from "../models/adminModel.js";
import { updateProductsFromFile } from "../models/productModel.js";
import { updatePricesFromFile } from "../models/priceModel.js";
import { updatePOIsFromFile } from "../models/poiModel.js";
import { deleteProducts, deletePOIs, getDiscountNumberByMonth, getWeeklyDiscountData } from "../models/adminModel.js";
import fs from "fs/promises";


let UPDATE_FROM_FILE = {
    "products": updateProductsFromFile,
    "prices": updatePricesFromFile,
    "poi": updatePOIsFromFile
};

async function adminControllerGet(req, res) {
    let type = req.query.type;
    let results;

    try {
        switch (type) {
            case "discount_number":
                const year = req.query.year;
                const month_number = req.query.month_number;
                results = await getDiscountNumberByMonth(year, month_number);
                return res.status(200).json(results);
            case "weekly_discount":
                const start_date = req.query.start_date;
                const category_id = req.query.category_id;
                const subcategory_id = req.query.subcategory_id;
                results = await getWeeklyDiscountData(start_date, category_id, subcategory_id);
                return res.status(200).json(results);
            default:
                return res.status(400).json({error: "Unknown type."});
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({error: "Internal server error."});
    }

    return res.status(200).end();


}

async function adminControllerPost(req, res) {
    const update_func = UPDATE_FROM_FILE[req.body.type];
    const filepath = req.files[0].path;

    if (update_func === undefined) {
        await fs.unlink(filepath);
        return res.status(400).json({error: "Unknown file type."});
    }

    try {
        const res = await update_func(filepath);
        if (res === null) {
            throw -1;
        }
    } catch (err) {
        await fs.unlink(filepath);
        if (err == -1) {
            return res.status(400).json({error: "Bad file."});
        }
        else if (err instanceof TypeError) {
            return res.status(400).json({error: "Incorrect file format."})
        }
        console.log(err);
        return res.status(500).json({error: "Internal server error."});
    }

    await fs.unlink(filepath);
    return res.status(200).end();
}

async function adminControllerDelete(req, res) {
    const delete_type = req.query.type;

    switch (delete_type) {
        case "products":
            await deleteProducts();
            break;
        case "poi":
            await deletePOIs();
            break;
        default:
            return res.status(400).json({error: "Unknown type."});
    }

    return res.status(200).end();

}

export {adminControllerGet, adminControllerPost, adminControllerDelete};