const EXPECTED_DATA = {
    "register": {
        "headers": [],
        "body": ["username", "password_b64", "email"]
    },
    "login": {
        "headers": [],
        "body": ["username", "password_b64"]
    }

}

function matchSchema(obj, endpoint) {
    const endpoint_data = EXPECTED_DATA[endpoint];
    if (endpoint_data === undefined) {
        return false;
    }
    
    for (let header of endpoint_data.headers) {
        if (obj.headers[header] === undefined) {
            return false;
        }
    }

    for (let key of endpoint_data.body) {
        if (obj.body[key] === undefined) {
            return false;
        }
    }

    return true;
}

export {matchSchema};