import jwt from "jsonwebtoken";

function createJWT(username) {
    let token = jwt.sign({
        username: username
    }, secret, {
        expiresIn: "6h"
    });
    return token;
}

export {createJWT};