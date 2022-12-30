import { changeUserDetails } from "../models/userModel.js";

async function userControllerPatch(req, res) {
    let username = res.locals.user_data.username;
    let new_username = req.body.new_username;
    let buff = new Buffer.from(req.body.new_password_b64, "base64");
    let password = buff.toString("utf-8");

    try {
        await changeUserDetails(username, new_username, hash);
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({error: "Username unavailable."});
        }

        console.log(err);
        return res.status(500).json({error: "Internal server error."});
    }

    return res.status(200).end();
}

export {userControllerPatch};