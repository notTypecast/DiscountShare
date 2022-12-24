import { promiseQuery } from "../util/query.js";


async function insertUser(username, pwd, email) {
    await promiseQuery("INSERT INTO user (username, hash, email) VALUES (?, ?, ?)", [username, pwd, email]);

    return null;
}

async function getUser(username) {
    let results = await promiseQuery("SELECT * FROM user WHERE username = ?", [username]);
    
    return results;
}

export {insertUser, getUser};