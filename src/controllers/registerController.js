import { createJWT } from "../util/token.js";
import { insertUser } from "../models/userModel.js";
import { hashPassword } from "../util/pass.js";
import { checkUsername, checkPassword } from "../util/userdetails.js";


// const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])+(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])+)+$/;


async function registerController(req, res) {
    // validate username and password
    let username_check = checkUsername(req.body.username);
    if (username_check !== true) {
        return res.status(400).json({error: username_check})
    }

    if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({error: "Invalid email."});
    }

    // password is transported as base64 encoded string in body
    let buff = new Buffer.from(req.body.password_b64, "base64");
    let password = buff.toString("utf-8");

    let password_check = checkPassword(password);

    if (password_check !== true) {
        return res.status(400).json({error: password_check});
    }

    // hash password securely to store in database
    let hashedPassword = await hashPassword(password);

    try {
        await insertUser(req.body.username, hashedPassword, req.body.email);
        let token = createJWT(req.body.username);
        return res.status(200).json({session_token: token});  
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({error: "Username unavailable."});
        }

        console.log(err);
        return res.status(500).json({error: "Internal server error."});
    }
}


export {registerController};