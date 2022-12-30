
function checkUsername(username) {
    // validate username and password
    if (username.length > 24 || username.length < 2) {
        return "Invalid username length.";
    }

    if (!/^[A-Za-z0-9]+$/.test(req.body.username)) {
        return "Invalid character in username.";
    }

    return true;
}

function checkPassword(password) {

}

export { checkUsername, checkPassword };