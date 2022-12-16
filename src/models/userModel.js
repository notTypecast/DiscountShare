

async function insertUser(username, pwd, email) {
    let errval = null;
    
    global.pool.query("INSERT INTO user(username, email, hash) VALUES (?, ?, ?)", [req.body.username, req.body.email, password], (err, result) => {
        errval = err;
        if (err) {
            console.log(err);
        }
    });

    return errval;
}