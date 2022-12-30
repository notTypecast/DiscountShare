import { promiseQuery } from "../util/query.js";

async function changeUserDetails(username, new_username, new_pwd) {
    let u = new_username !== undefined;
    let p = new_pwd !== undefined;
    
    let query = "UPDATE user SET ";
    let args = [];

    if (u) {
        query += "username=? ";
        args.push(new_username);

        if (p) {
            query += "AND ";
        }
    }

    if (p) {
        query += "hash=? ";
        args.push(new_pwd);
    }

    query += " WHERE username=?";
    args.push(username);

    await promiseQuery(query, args);

    return null;
}

async function insertUser(username, pwd, email) {
    await promiseQuery("INSERT INTO user (username, hash, email) VALUES (?, ?, ?)", [username, pwd, email]);

    return null;
}

async function getUser(username) {
    let results = await promiseQuery("SELECT * FROM user WHERE username = ?", [username]);
    
    return results;
}

export {insertUser, getUser, changeUserDetails};