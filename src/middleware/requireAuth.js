import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const secret = process.env.JWT_SECRET;


function requireAuth(req, res, next) {
    let token = req.cookies.session_token;
    try {
        if (token === undefined) {
            throw "No token found.";
        }
        let decoded = jwt.verify(token, secret);
        res.locals.user_data = decoded;
    } catch (err) {
        console.log(err);
        return res.status(403).redirect("/login");
    }
    next();
} 

export {requireAuth};