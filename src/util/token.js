import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config()

const secret = process.env.JWT_SECRET;

function createJWT(username, is_admin) {
    let token = jwt.sign({
        username: username,
        is_admin: is_admin
    }, secret, {
        expiresIn: "6h"
    });
    return token;
}

export {createJWT};