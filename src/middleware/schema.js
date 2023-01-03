/*
* Middleware for ensuring a request has the correct format
* Request format objects contain the keys that should exist in the request, with the value being a JSONArray containing each expected parameter
* If inside the JSONArray, there is another JSONArray of values, it means that:
* --> If the first value is 0, exactly one of the following values is required
* --> If the first value is 1, at least one of the following values if required
*/

const EXPECTED_DATA_GET = {
    "shops": {
        "query": ["latitude", "longitude"]
    },
    "categories": {
        "query": []
    },
    "discounts": {
        "query": ["shop_id"]
    },
    "products": {
        "query": [[1, "search_term", "category_id", "subcategory_id"]]
    },
    "user": {
        "query": ["history_type"]
    }
};

const EXPECTED_DATA_POST = {
    "register": {
        "body": ["username", "password_b64", "email"]
    },
    "login": {
        "body": ["username", "password_b64"]
    },
    "discounts": {
        "body": ["shop_id", "product_name", "cost"]
    },
    "admin": {
        "files": [],
        "body": ["type"]
    }
};

const EXPECTED_DATA_PATCH = {
    "discounts": {
        "body": [[0, "in_stock", "rating"], "shop_id", "product_name", "latitude", "longitude"]
    },
    "user": {
        "body": [[1, "new_username", "new_password_b64"]]
    }
};

const EXPECTED_DATA_DELETE = {
    "admin": {
        "query": ["type"]
    }
}

const REQ_MATCH = {
    "get": EXPECTED_DATA_GET,
    "post": EXPECTED_DATA_POST,
    "patch": EXPECTED_DATA_PATCH,
    "delete": EXPECTED_DATA_DELETE
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
    const endpoint_data = REQ_MATCH[req_type][endpoint];
    if (endpoint_data === undefined) {
        return false;
    }

    for (let paramObjKey in endpoint_data) {
        if (obj[paramObjKey] === undefined) {
            return false;
        }

        for (let key of endpoint_data[paramObjKey]) {
            // if key is option array
            if (Array.isArray(key)) {
                if (!matchNestedArray(obj[paramObjKey], key)) {
                    return false;
                }
            }
            else if (obj[paramObjKey][key] === undefined) {
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