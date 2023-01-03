import {  } from "../models/adminModel.js";
import { updateProductsFromFile } from "../models/productModel.js";
import { updatePricesFromFile } from "../models/priceModel.js";
import { updatePOIsFromFile } from "../models/poiModel.js";
import { deleteProducts, deletePOIs } from "../models/adminModel.js";
import fs from "fs/promises";


let UPDATE_FROM_FILE = {
    "products": updateProductsFromFile,
    "prices": updatePricesFromFile,
    "poi": updatePOIsFromFile
};

async function adminControllerPost(req, res) {
    let update_func = UPDATE_FROM_FILE[req.body.type];
    let filepath = req.files[0].path;

    if (update_func === undefined) {
        await fs.unlink(filepath);
        return res.status(400).json({error: "Unknown file type."});
    }

    try {
        let res = await update_func(filepath);
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
    let delete_type = req.query.type;

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

export {adminControllerPost, adminControllerDelete};