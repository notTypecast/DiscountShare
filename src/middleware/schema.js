const EXPECTED_DATA = {
    "register": {
        "headers": [],
        "body": ["username", "password_b64", "email"]
    },
    "login": {
        "headers": [],
        "body": ["username", "password_b64"]
    },
    "shops": {
        "headers": [],
        "body": ["latitude", "longitude"]
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

function generateMatchSchema(schemaName) {
    return (req, res, next) => {
        if (!matchSchema(req, schemaName)) {
            return res.status(400).json({error: "Request did not match schema."});
        }
        next();
    }
}

export {generateMatchSchema};