import { changeUserDetails, getUserDiscountHistory, getUserReviewHistory, getUserScoreData } from "../models/userModel.js";
import { hashPassword } from "../util/pass.js";
import { checkUsername, checkPassword } from "../util/userdetails.js";

async function userControllerGet(req, res) {
    let username = res.locals.user_data.username;
    let type = req.query.history_type;

    // breaks not required because of returns
    switch (type) {
        case "discounts":
            try {
                let results = await getUserDiscountHistory(username);
                return res.status(200).json(results);
            } catch (err) {
                console.log(err);
                return res.status(500).json({error: "Internal server error."});
            }
        case "reviews":
            try {
                let results = await getUserReviewHistory(username);
                return res.status(200).json(results);
            } catch (err) {
                console.log(err);
                return res.status(500).json({error: "Internal server error."});
            }
        case "score_data":
            try {
                let results = await getUserScoreData(username);
                return res.status(200).json(results);
            } catch (err) {
                console.log(err);
                return res.status(500).json({error: "Internal server error."});
            }
        default:
            return res.status(400).json({error: "Unknown history type."})
    }
}

async function userControllerPatch(req, res) {
    let username = res.locals.user_data.username;
    let new_username = req.body.new_username;
    let buff = new Buffer.from(req.body.new_password_b64, "base64");
    let new_password = buff.toString("utf-8");

    if (new_username !== undefined) {
        let username_check = checkUsername(new_username);
        if (username_check !== true) {
            return res.status(400).json({error: username_check});
        }
    }

    if (new_password !== undefined) {
        let password_check = checkPassword(new_password);
        if (password_check !== true) {
            return res.status(400).json({error: password_check});
        }
    }

    let hashedPassword = await hashPassword(password);

    try {
        await changeUserDetails(username, new_username, hashedPassword);
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({error: "Username unavailable."});
        }

        console.log(err);
        return res.status(500).json({error: "Internal server error."});
    }

    return res.status(200).end();
}

export {userControllerGet, userControllerPatch};