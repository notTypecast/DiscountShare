import { createJWT } from "../util/token.js";
import { insertUser } from "../models/userModel.js";
import { hashPassword } from "../util/pass.js";


// const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])+(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])+)+$/;


async function registerController(req, res) {
    // validate username and password
    if (req.body.username.length > 24 || req.body.username.length < 2) {
        return res.status(400).json({error: "Invalid username length."});
    }

    if (!/^[A-Za-z0-9]+$/.test(req.body.username)) {
        return res.status(400).json({error: "Invalid character in username."});
    }

    if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({error: "Invalid email."});
    }

    // password is transported as base64 encoded string in body
    let buff = new Buffer.from(req.body.password_b64, "base64");
    let password = buff.toString("utf-8");

    if (password.length < 8) {
        return res.status(400).json({error: "Password must be 8 characters or longer."});
    }

    if (!/[A-Z]/.test(password)) {
        return res.status(400).json({error: "Password must contain at least 1 uppercase letter."});
    }

    if (!/[0-9]/.test(password)) {
        return res.status(400).json({error: "Password must contain at least 1 digit."});
    }

    if (!/[~`!@#\$%\^&\*\(\)-_\+=\[\]{}\|\\;:'",<>,\.\?\/]/.test(password)) {
        return res.status(400).json({error: "Password must contain at least 1 symbol."});
    }

    // hash password securely to store in database
    let hashedPassword = await hashPassword(password);

    let errval = await insertUser(req.body.username, hashedPassword, req.body.email);


    // set jwt token cookie for new user
    if (errval === null) {
        let token = createJWT(req.body.username);
        return res.status(200).json({session_token: token});  
    }

    return res.status(409).json({error: "Username unavailable."});

}


export {registerController};