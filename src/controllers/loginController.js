import { createJWT } from "../util/token.js";
import { getUser } from "../models/userModel.js";
import { validatePassword } from "../util/pass.js";

async function loginController(req, res) {
    let results;
    try {
        results = await getUser(req.body.username);
        if (results.length == 0) {
            return res.status(403).json({error: "Invalid credentials."});
        }

    } catch(err) {
        console.log(err);
        return res.status(500).json({error: "Internal server error."});
    }

    // password is transported as base64 encoded string in body
    let buff = new Buffer.from(req.body.password_b64, "base64");
    let password = buff.toString("utf-8");

    if (!(await validatePassword(password, results[0].hash))) {
        return res.status(403).json({error: "Invalid credentials."});
    }

    let token = createJWT(results[0].username);
    return res.status(200).json({session_token: token});
}

export {loginController};