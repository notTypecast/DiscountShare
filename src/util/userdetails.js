
function checkUsername(username) {
    // validate username and password
    if (username.length > 24 || username.length < 2) {
        return "Invalid username length.";
    }

    if (!/^[A-Za-z0-9]+$/.test(username)) {
        return "Invalid character in username.";
    }

    return true;
}

function checkPassword(password) {
    if (password.length < 8) {
        return "Password must be 8 characters or longer.";
    }

    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least 1 uppercase letter.";
    }

    if (!/[0-9]/.test(password)) {
        return "Password must contain at least 1 digit.";
    }

    if (!/[~`!@#\$%\^&\*\(\)-_\+=\[\]{}\|\\;:'",<>,\.\?\/]/.test(password)) {
        return "Password must contain at least 1 symbol.";
    }

    return true;
}

export { checkUsername, checkPassword };