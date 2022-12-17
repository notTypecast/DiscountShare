import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config()

const secret = process.env.JWT_SECRET;

function createJWT(username) {
    let token = jwt.sign({
        username: username
    }, secret, {
        expiresIn: "6h"
    });
    return token;
}

export {createJWT};