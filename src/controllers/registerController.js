import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createJWT } from "../util/token.js";
import { matchSchema } from "../schema/requests.js";

dotenv.config();

const secret = process.env.JWT_SECRET;



async function registerController(req, res) {
    if (!matchSchema(req, "register")) {
        console.log("Schema did not match.");
        return res.status(400).json({error: "Request did not match schema."});
    }

    let token = createJWT(req.body.username);
    
    let buff = new Buffer.from(req.body.password_b64, "base64");
    let password = buff.toString("utf-8");

    if (req.body.username.length > 24 || req.body.username.length < 2) {
        return res.status(400).json({error: "Invalid username length."});
    }

    let errval = await insertUser(req.body.username, password, req.body.email);

    if (errval === null) {
        res.cookie("session_token", token);
        return res.status(200).end();    
    }

    return res.status(409).json({error: "Username unavailable."});

}


export {registerController};