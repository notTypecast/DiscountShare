import { promiseQuery } from "../util/query.js";


async function insertUser(username, pwd, email) {
    try {
        await promiseQuery("INSERT INTO user (username, hash, email) VALUES (?, ?, ?)", [username, pwd, email]);
    } catch (err) {
        return err;
    }
    return null;
}

async function getUser(username) {
    let results;
    try {
        results = await promiseQuery("SELECT * FROM user WHERE username = ?", [username]);
    } catch (err) {
        return err;
    }
    return results;
}

export {insertUser, getUser};