/*
* Middleware for ensuring a request has the correct format
* For GET requests, GET format object contains a list of expected parameters
* For other requests, request format objects contain a list of expected headers, as well as another list of required body values
* If inside a JSONArray, there is another JSONArray of values, it means that:
* --> If the first value is 0, exactly one of the following values is required
* --> If the first value is 1, at least one of the following values if required
*/
// TODO either remove headers completely or, if ever used, add ability for nested array
const EXPECTED_DATA_POST = {
    "register": {
        "headers": [],
        "body": ["username", "password_b64", "email"]
    },
    "login": {
        "headers": [],
        "body": ["username", "password_b64"]
    },
    "discounts": {
        "headers": [],
        "body": ["shop_id", "product_name", "cost"]
    }
};

const EXPECTED_DATA_GET = {
    "shops": ["latitude", "longitude"],
    "categories": [],
    "discounts": ["shop_id"],
    "products": [[1, "search_term", "category_id", "subcategory_id"]],
    "user": ["history_type"]
};

const EXPECTED_DATA_PATCH = {
    "discounts": {
        "headers": [],
        "body": [[0, "in_stock", "rating"], "shop_id", "product_name", "latitude", "longitude"]
    },
    "user": {
        "headers": [],
        "body": [[1, "new_username", "new_password_b64"]]
    }
};

const REQ_MATCH = {
    "post": EXPECTED_DATA_POST,
    "patch": EXPECTED_DATA_PATCH
};

function matchNestedArray(param_obj, arr) {
    let flag = 0;
    let mode = arr[0];

    for (let key of arr.slice(1)) {
        if (param_obj[key] !== undefined) {
            ++flag;
        }
    }
    return mode === 0 ? flag === 1 : flag > 0;

}

function matchSchema(obj, req_type, endpoint) {
    if (req_type === "get") {
        const endpoint_data = EXPECTED_DATA_GET[endpoint];
        if (endpoint_data === undefined) {
            return false;
        }

        for (let parameter of endpoint_data) {
            if (Array.isArray(parameter)) {
                if (!matchNestedArray(obj.query, parameter)) {
                    return false;
                }
            }
            else if (obj.query[parameter] === undefined) {
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
                if (!matchNestedArray(obj.body, key)) {
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