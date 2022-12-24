const rootURL = "http://localhost:3000";

// create loader
const loader = document.createElement("div");
let loaderVisible = false;
loader.classList.add("loader");

function showLoader() {
    if (!loaderVisible) {
        document.body.appendChild(loader);
        loaderVisible = true;
    }
}

function hideLoader() {
    if (loaderVisible) {
        loader.remove();
        loaderVisible = false;
    }
}

let activeToast;

const makeToast = (type, msg, duration) => {
    let body = document.body;
    let toast = document.createElement("div");
    toast.classList.add("toast");
    let icon = document.createElement("span");
    icon.classList.add("material-icons");
    switch (type) {
        case "success":
            toast.classList.add("success-toast");
            toast.innerHTML = msg;
            icon.innerHTML = "done";
            toast.appendChild(icon);
            break;
        case "failure":
            toast.classList.add("failure-toast");
            toast.innerHTML = msg;
            icon.innerHTML = "close";
            toast.appendChild(icon);
            break;
    }
    if (activeToast != undefined) {
        activeToast.remove();
    }
    body.appendChild(toast);
    activeToast = toast;
    window.setTimeout(() => {
        toast.classList.add("toast-exit");
        window.setTimeout(() => {
            toast.remove();
        }, 500);
    }, duration);
};


// create input warning text
const warningWrap = document.createElement("div");
warningWrap.classList.add("warning-wrap");
const warnings = {};
let btn;

function setSubmitButton(button) {
    btn = button;
}

function setWarningLocation(beforeNode) {
    beforeNode.parentNode.insertBefore(warningWrap, beforeNode);
}

function addWarning(inputNode, warning) {
    if (warnings[inputNode.id] == undefined) {
        warnings[inputNode.id] = document.createElement("div");
        warningWrap.appendChild(warnings[inputNode.id]);
        
    }
    if (!inputNode.classList.contains("warning-input")) {
        inputNode.classList.add("warning-input");
    }
    const warningText = document.createElement("p");
    warningText.classList.add("warning");
    warningText.innerHTML = warning;
    warnings[inputNode.id].appendChild(warningText);
    try {
        btn.disabled = true;
    }
    catch (err) {}
}

function removeWarnings(inputNode) {
    if (inputNode.classList.contains("warning-input")) {
        inputNode.classList.remove("warning-input");
    }
    if (warnings[inputNode.id] != undefined) {
        warnings[inputNode.id].remove();
        delete warnings[inputNode.id];
    }
    if (Object.keys(warnings).length == 0) {
        try {
            btn.disabled = false;
        }
        catch (err) {}
    }
}

async function sameOriginPostRequest(endpoint, body) {
    try {
        const response = await fetch(rootURL + endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body),
            redirect: "manual"
        });
        return response;
    } catch (err) {
        console.log(err);
        return err;
    }
}

async function sameOriginPatchRequest(endpoint, body) {
    try {
        const response = await fetch(rootURL + endpoint, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
        return response;
    } catch (err) {
        console.log(err);
        return err;
    } 
}

async function sameOriginGetRequest(endpoint, params) {
    try {
        const keys = Object.keys(params);
        let queryString = "?";
        let total_keys = 0;
        if (keys.length !== 0) {
            for (let param of keys) {
                if (params[param] !== undefined) {
                    ++total_keys;
                    queryString += `${param}=${params[param]}&`;
                }
            }
            if (total_keys !== 0) {
                queryString = queryString.substring(0, queryString.length - 1);
            }
        }

        const response = await fetch(rootURL + endpoint + (total_keys === 0 ? "" : queryString));

        return response;
    } catch (err) {
        console.log(err);
        return err;
    }
}

function deleteAllCookies() {
    let cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        let eqPos = cookie.indexOf("=");
        let name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}

function createPagePopup(mountNode, headerNode, bodyNode, onLoad) {
    let popup = document.createElement("div");
    popup.classList.add("page-popup");
    let popupHeader = document.createElement("div");
    popupHeader.classList.add("page-popup-header");
    popup.append(popupHeader);
    let closeBtn = document.createElement("span");
    closeBtn.classList.add("material-icons");
    closeBtn.classList.add("page-popup-close");
    closeBtn.innerHTML = "close";
    closeBtn.addEventListener("click", () => {
        popup.remove();
    });  
    popup.append(closeBtn);

    if (headerNode !== undefined) {
        headerNode.classList.add("page-popup-title");
        popupHeader.appendChild(headerNode);
    }

    let popupBody = document.createElement("div");
    popupBody.classList.add("page-popup-body");
    popup.append(popupBody);
    if (bodyNode !== undefined) {
        popupBody.append(bodyNode);
    }

    if (onLoad !== undefined) {
        onLoad();
    }

    mountNode.appendChild(popup);
}

