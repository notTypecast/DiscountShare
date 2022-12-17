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

async function submitForm(endpoint, body) {
    showLoader();
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
        redirect: "follow"
    });
    hideLoader();
    return response;
}