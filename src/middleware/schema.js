/*
* Middleware for ensuring a request has the correct format
* For GET requests, GET format object contains a list of expected parameters
* For other requests, request format objects contain a list of expected headers, as well as another list of required body values
* If inside a JSONArray, there is another JSONArray of values, it means that only one of those values is required (body only)
*/

const EXPECTED_DATA_POST = {
    "register": {
        "headers": [],
        "body": ["username", "password_b64", "email"]
    },
    "login": {
        "headers": [],
        "body": ["username", "password_b64"]
    }
};

const EXPECTED_DATA_GET = {
    "shops": ["latitude", "longitude"],
    "categories": [],
    "discounts": ["shop_id"]
};

const EXPECTED_DATA_PATCH = {
    "discounts": {
        "headers": [],
        "body": [["in_stock", "rating"], "shop_id", "product_name", "latitude", "longitude"]
    }
};

const REQ_MATCH = {
    "post": EXPECTED_DATA_POST,
    "patch": EXPECTED_DATA_PATCH
};

function matchSchema(obj, req_type, endpoint) {
    if (req_type === "get") {
        const endpoint_data = EXPECTED_DATA_GET[endpoint];
        if (endpoint_data === undefined) {
            return false;
        }

        for (let parameter of endpoint_data) {
            if (obj.query[parameter] === undefined) {
                return false;
            }
        }
    }
    else {
        const endpoint_data = REQ_MATCH[req_type][endpoint];
        if (endpoint_data === undefined) {
            return false;
        }
        
        for (let header of endpoint_data.headers) {
            if (obj.headers[header] === undefined) {
                return false;
            }
        }

        for (let key of endpoint_data.body) {
            // if key is option array
            if (Array.isArray(key)) {
                // count how many of those options exist in request
                let flag = 0;
                for (let key2 of key) {
                    if (obj.body[key2] !== undefined) {
                        ++flag;
                    }
                }
                // if none or more than 1 exist, request is invalid
                if (flag !== 1) {
                    return false;
                }
            }
            else if (obj.body[key] === undefined) {
                return false;
            }
        }
    }

    return true;
}

function generateMatchSchema(schemaName, req_type) {
    return (req, res, next) => {
        if (!matchSchema(req, req_type, schemaName)) {
            return res.status(400).json({error: "Request did not match schema."});
        }
        next();
    }
}

export {generateMatchSchema};