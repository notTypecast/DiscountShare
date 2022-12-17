import bcrypt from "bcrypt";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const secret = process.env.JWT_SECRET;

async function hashPassword(password) {
    // hmac password to ensure correct length for use in bcrypt hash function
    const hmacDigest = crypto.createHmac("sha256", secret).update(password).digest("base64");
    return await bcrypt.hash(hmacDigest, 10);
}

async function validatePassword(gotPass, hash) {
    const hmacDigest = crypto.createHmac("sha256", secret).update(gotPass).digest("base64");
    return await bcrypt.compare(hmacDigest, hash);
}

export {hashPassword, validatePassword};