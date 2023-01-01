import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { getUserLastUpdated } from "../models/userModel.js";

dotenv.config();

const secret = process.env.JWT_SECRET;


async function requireAuth(req, res, next) {
    let token = req.cookies.session_token;
    try {
        if (token === undefined) {
            throw "No token found.";
        }
        let decoded = jwt.verify(token, secret);
        let last_updated_timestamp = await getUserLastUpdated(decoded.username);
        if (last_updated_timestamp > Math.floor(Date.now() / 1000)) {
            throw "Token is invalidated.";
        }
        res.locals.user_data = decoded;
    } catch (err) {
        res.clearCookie("session_token")
        return res.status(403).redirect("/login");
    }
    next();
}

export {requireAuth};