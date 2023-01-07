const rootURL = "http://localhost:3000";

// January is 0
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

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
        case "partial-success":
            toast.classList.add("partial-success-toast");
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
const g_warningWrap = document.createElement("div");
g_warningWrap.classList.add("warning-wrap");
const g_warnings = {};
let g_btn;

function setSubmitButton(button) {
    g_btn = button;
}

function setWarningLocation(beforeNode, injected) {
    let warningWrap = g_warningWrap;
    if (injected !== undefined) {
        injected.warningWrap = document.createElement("div");
        warningWrap.classList.add("warning-wrap");
        injected.warnings = {};
        warningWrap = injected.warningWrap;
    }
    beforeNode.parentNode.insertBefore(warningWrap, beforeNode);
}

function addWarning(inputNode, warning, injected) {
    let warnings = g_warnings;
    let btn = g_btn;
    let warningWrap = g_warningWrap;
    if (injected !== undefined) {
        if (injected.warningWrap !== undefined) {
            warningWrap = injected.warningWrap;
        }
        if (injected.warnings !== undefined) {
            warnings = injected.warnings;
        }
        if (injected.btn !== undefined) {
            btn = injected.btn;
        }
    }
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

function removeWarnings(inputNode, injected) {
    let warnings = g_warnings;
    let btn = g_btn;
    if (injected !== undefined) {
        if (injected.warnings !== undefined) {
            warnings = injected.warnings;
        }
        if (injected.btn !== undefined) {
            btn = injected.btn;
        }
    }


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

function buildParamString(params) {
    const keys = Object.keys(params);
    let queryString = "?";
    if (keys.length !== 0) {
        for (let param of keys) {
            if (params[param] !== undefined) {
                queryString += `${param}=${encodeURI(params[param])}&`;
            }
        }
    }
    queryString = queryString.substring(0, queryString.length - 1);

    return queryString;
}

async function sameOriginPostRequest(endpoint, body, files) {
    try {

        let postBody = JSON.stringify(body);
        if (files !== undefined) {
            const formData = new FormData();
            for (let file of files) {
                formData.append("files", file);
            }
            for (let key of Object.keys(body)) {
                formData.append(key, body[key]);
            }
            postBody = formData;
        }

        let fetchBody = {
            method: "POST",
            body: postBody,
            redirect: "manual"

        }
        if (files === undefined) {
            fetchBody.headers = {
                "Content-Type": "application/json"
            };
        }
        const response = await fetch(rootURL + endpoint, fetchBody);
        return response;
    } catch (err) {
        console.log(err);
        return err;
    }
}

async function sameOriginDeleteRequest(endpoint, params) {
    try {
        const queryString = buildParamString(params);
        const response = await fetch(rootURL + endpoint + queryString, {
            method: "DELETE"
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
        const queryString = buildParamString(params);
        const response = await fetch(rootURL + endpoint + queryString);

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

function createPagePopup(mountNode, headerNode, bodyNodes, onLoad, onClose) {
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
        if (onClose !== undefined) {
            onClose();
        }
    });  
    popup.append(closeBtn);

    if (headerNode !== undefined) {
        headerNode.classList.add("page-popup-title");
        popupHeader.appendChild(headerNode);
    }

    let popupBody = document.createElement("div");
    popupBody.classList.add("page-popup-body");
    popup.append(popupBody);
    if (bodyNodes !== undefined) {
        for (let node of bodyNodes) {
            popupBody.appendChild(node);
        }
    }

    if (onLoad !== undefined) {
        onLoad();
    }

    mountNode.appendChild(popup);
}

function createDropdown(className, dropdownID, options, defaultOption) {
    let dropdown = document.createElement("select");
    dropdown.classList.add(className);
    dropdown.id = dropdownID;
    let def = document.createElement("option");
    def.setAttribute("disabled", "");
    def.setAttribute("selected", "");
    def.setAttribute("hidden", "");
    def.value = defaultOption;
    def.innerText = defaultOption;
    dropdown.appendChild(def);
    for (let option of options) {
        let opt = document.createElement("option");
        opt.value = option;
        opt.innerText = option;
        dropdown.appendChild(opt);
    }
    return dropdown;
}

function updateDropdown(ddown, options, defaultOption) {
    ddown.innerHTML = "";
    // add default option
    let def = document.createElement("option");
    def.setAttribute("disabled", "");
    def.setAttribute("selected", "");
    def.setAttribute("hidden", "");
    def.value = defaultOption;
    def.innerText = defaultOption;
    ddown.appendChild(def);
    for (let option of options) {
        let opt = document.createElement("option");
        opt.value = option;
        opt.innerText = option;
        ddown.appendChild(opt);
    }
}

function emptyDropdown(ddown, defaultOption) {
    ddown.innerHTML = "";
    let def = document.createElement("option");
    def.setAttribute("disabled", "");
    def.setAttribute("selected", "");
    def.setAttribute("hidden", "");
    def.value = defaultOption;
    def.innerText = defaultOption;
    ddown.appendChild(def);
}

function logout() {
    deleteAllCookies();
    window.location.href = "/login";
}

function readCookies() {
    let cookies = document.cookie.split(";");
    let cookieMap = {};
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim().split("=");
        cookieMap[cookie[0]] = cookie[1];
    }
    return cookieMap;
}

function getPropertyFromToken(property) {
    const token = readCookies()["session_token"];
    const payload = token.split(".")[1];
    const decodedPayload = atob(payload);
    const result = JSON.parse(decodedPayload)[property];

    return result;
}

function isLeapYear(year) {
    if (year % 4 !== 0) return false;
    if (year % 100 !== 0) return true;
    if (year % 400 !== 0) return false;
    return true;
  }
  