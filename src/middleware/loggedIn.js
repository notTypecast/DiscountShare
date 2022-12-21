import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const secret = process.env.JWT_SECRET;

function loggedIn(req, res, next) {
    let token = req.cookies.session_token;
    try {
        if (token === undefined) {
            throw "No token found.";
        }
        let decoded = jwt.verify(token, secret);
        res.locals.user_data = decoded;
        return res.status(200).redirect("/");
    } catch (err) {
        res.clearCookie("session_token")
    }
    next();
}

export {loggedIn};