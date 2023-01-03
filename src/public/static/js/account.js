const pageTitle = document.querySelector(".page-title");
const logoutBtn = document.getElementById("logoutLink");
const burgerMenu = document.querySelector(".nav-burger-menu");
let mobileMenu = null;
burgerMenu.addEventListener("click", toggleMobileMenu);

function toggleMobileMenu() {
     if (mobileMenu === null) {
        mobileMenu = true;
    }
    document.querySelector("nav").classList.toggle("nav-active");
}


const userEndpoint = "/api/user";

let onHold = ["page-section", "page-title"];

let changeUsernameInjected = {};

let changePasswordInjected = {};

let routes = {
    "My Account": accountRoute,
    "Discount History": discountsRoute,
    "Review History": reviewsRoute,
    "Statistics": statisticsRoute
};
let activeLink = document.querySelector(".nav-link-active");
accountRoute();

for (let link of document.querySelectorAll(".nav-link")) {
    link.addEventListener("click", matchRoute);
}

async function matchRoute(e) {
    let target = e.target;
    if (target.tagName == "SPAN") {
        target = target.parentElement;
    }
    let linkText = target.innerText;
    if (linkText === activeLink.innerText) {
        return;
    }
    activeLink.classList.remove("nav-link-active");
    target.classList.add("nav-link-active");
    activeLink = target;
    mainView.clear();
    await routes[linkText]();
    if (mobileMenu) {
        toggleMobileMenu();
    }
}

logoutBtn.addEventListener("click", logout);

/*

        <h1 class="page-title">My Account</h1>
        <section class="page-section">
            <h2 class="page-section-header">Change username</h2>
            <form class="internal-form">
                <input type="text" class="internal-form-input" id="changeUsernameInput" placeholder="Enter new username">
                <button type="submit" class="internal-form-submit" id="changeUsernameBtn">Change</button>
            </form>
        </section>
        <section class="page-section">
            <h2 class="page-section-header">Change password</h2>
            <form class="internal-form">
                <input type="password" class="internal-form-input" id="changePasswordInput" placeholder="Enter new password">
                <input type="password" class="internal-form-input" id="confirmPasswordInput" placeholder="Confirm new password">
                <button type="submit" class="internal-form-submit" id="changePasswordBtn">Change</button>
            </form>
        </section>
        */

async function accountRoute() {
    mainView.setTitle("Welcome, " + getUsernameFromToken() + ".");

    async function changeUsername(e) {
        e.preventDefault();
        let changeUsernameInput = e.target.parentNode.querySelector("#changeUsernameInput");
        const username = changeUsernameInput.value;
    
        showLoader();
        const response = await sameOriginPatchRequest(userEndpoint, {new_username: username});
        let data = await response.json();
        hideLoader();
        if (response.status>=200 && response.status<300) {
            makeToast("success", "Username changed successfully.", 3000);
            mainView.setTitleDOM("Welcome, " + username + ".");
            document.cookie = "session_token=" + data.session_token+"; SameSite=Lax";
            changeUsernameInput.value = "";
        } else {
            makeToast("failure", data.error, 3000);
        }
    }
    
    async function changePassword(e) {
        e.preventDefault();
        let changePasswordInput = e.target.parentNode.querySelector("#changePasswordInput");
        const password = changePasswordInput.value;
        showLoader();
        const response = await sameOriginPatchRequest(userEndpoint, {
            "new_password_b64": window.btoa(password)
        });
        let data = await response.json();
        hideLoader();
        if (response.status>=200 && response.status<300) {
            makeToast("success", "Password changed successfully.", 3000);
            document.cookie = "session_token=" + data.session_token+"; SameSite=Lax";
            changePasswordInput.value = "";
            confirmPasswordInput.value = "";
        } else {
            makeToast("failure", data.error, 3000);
        }
    }
    
    let changeUsernameForm = document.createElement("form");
    changeUsernameForm.classList.add("internal-form");

    let changeUsernameInput = document.createElement("input");
    changeUsernameInput.setAttribute("type", "text");
    changeUsernameInput.setAttribute("id", "changeUsernameInput");
    changeUsernameInput.setAttribute("placeholder", "Enter new username");
    changeUsernameInput.classList.add("internal-form-input");
    changeUsernameInput.addEventListener("keyup", (e) => {
        const text = e.target.value;
    
        removeWarnings(e.target, changeUsernameInjected);
    
        if (text.length == 0) {
            return;
        }
    
        if (text.length < 2) {
            addWarning(e.target, "Username should be longer than 1 character.", changeUsernameInjected);        
        }
    
        if (text.length > 24) {
            addWarning(e.target, "Username should not be longer than 24 characters.", changeUsernameInjected);
        }
    
        if (!/^[A-Za-z0-9]+$/.test(text)) {
            addWarning(e.target, "Username should only contain letters and digits.", changeUsernameInjected);
        }
    });

    let changeUsernameBtn = document.createElement("button");
    changeUsernameBtn.setAttribute("type", "submit");
    changeUsernameBtn.setAttribute("id", "changeUsernameBtn");
    changeUsernameBtn.classList.add("internal-form-submit");
    changeUsernameBtn.innerHTML = "Change";
    changeUsernameBtn.addEventListener("click", changeUsername);

    changeUsernameForm.appendChild(changeUsernameInput);
    changeUsernameForm.appendChild(changeUsernameBtn);

    mainView.addSection("Change username", changeUsernameForm);

    let changePasswordForm = document.createElement("form");
    changePasswordForm.classList.add("internal-form");
    
    let changePasswordInput = document.createElement("input");
    changePasswordInput.setAttribute("type", "password");
    changePasswordInput.setAttribute("id", "changePasswordInput");
    changePasswordInput.setAttribute("placeholder", "Enter new password");
    changePasswordInput.classList.add("internal-form-input");


    let confirmPasswordInput = document.createElement("input");
    confirmPasswordInput.setAttribute("type", "password");
    confirmPasswordInput.setAttribute("id", "confirmPasswordInput");
    confirmPasswordInput.setAttribute("placeholder", "Confirm new password");
    confirmPasswordInput.classList.add("internal-form-input");
    confirmPasswordInput.addEventListener("keyup", confirmPasswordEventListener);

    changePasswordInput.addEventListener("keyup", (e) => {
        const text = e.target.value;
    
        removeWarnings(e.target, changePasswordInjected);
    
        confirmPasswordEventListener(confirmPasswordInput);
    
        if (text.length == 0) {
            return;
        }
    
        if (text.length < 8) {
            addWarning(e.target, "Password should be 8 characters or longer.", changePasswordInjected);
        }
    
        if (!/[A-Z]/.test(text)) {
            addWarning(e.target, "Password must contain at least 1 uppercase letter.", changePasswordInjected);
        }
    
        if (!/[0-9]/.test(text)) {
            addWarning(e.target, "Password must contain at least 1 digit.", changePasswordInjected);
        }
    
        if (!/[\~\`\!\@\#\$\%\^\&\*\(\)\-\_\+\=\[\]\{\}\|\\\;\:\'\"\,\<\>\,\.\?\/]/.test(text)) {
            addWarning(e.target, "Password must contain at least 1 symbol.", changePasswordInjected);
        }
    });

    function confirmPasswordEventListener(e) {
        const text = confirmPasswordInput.value;
    
        removeWarnings(confirmPasswordInput, changePasswordInjected);
    
        if (text.length == 0) {
            return;
        }
    
        password = changePasswordInput.value;
    
        if (text !== password) {
            addWarning(confirmPasswordInput, "Passwords do not match.", changePasswordInjected);
        }
    }

    let changePasswordBtn = document.createElement("button");
    changePasswordBtn.setAttribute("type", "submit");
    changePasswordBtn.setAttribute("id", "changePasswordBtn");
    changePasswordBtn.classList.add("internal-form-submit");
    changePasswordBtn.innerHTML = "Change";
    changePasswordBtn.addEventListener("click", changePassword);

    changePasswordForm.appendChild(changePasswordInput);
    changePasswordForm.appendChild(confirmPasswordInput);
    changePasswordForm.appendChild(changePasswordBtn);

    mainView.addSection("Change password", changePasswordForm);
    
    mainView.displaySections();

    disableHold(onHold);

    changeUsernameInjected.btn = changeUsernameBtn;
    changeUsernameInjected.input = changeUsernameInput;

    changePasswordInjected.btn = changePasswordBtn;
    changePasswordInjected.input = changePasswordInput;

    setWarningLocation(changeUsernameInjected.btn, changeUsernameInjected);
    setWarningLocation(changePasswordInjected.btn, changePasswordInjected);
}

async function discountsRoute() {
    mainView.setTitle("Discount History");

    showLoader();
    let response = await sameOriginGetRequest(userEndpoint, {
        "history_type": "discounts"
    });
    let data = await response.json();
    hideLoader();
    
    if (!(response.status>=200 && response.status<300)) {
        makeToast("failure", data.error, 3000);
        return;
    }

    if (data.length > 0) {
        let discountsTable = new TableCreator(["Product name", "Shop", "Price", "Submission Date", "Expiry Date", "Time", "Likes", "Dislikes", "Active"]);
        
        for (let row of data) {
            let pDate = new Date(row.posted);
            discountsTable.appendRow([row.product_name, row.name === null ? row.shop_id : row.name, row.cost + "€", pDate.toLocaleDateString(), new Date(row.expiry).toLocaleDateString(), pDate.toLocaleTimeString(), row.likes, row.dislikes, row.expired ? "No" : "Yes"]);
        }
        
        
        mainView.addSection(null, discountsTable.getTable(), ["table-page-section"]);
    } else {
        let p = document.createElement("p");
        p.innerHTML = "No discount history found.";
        p.classList.add("no-results");
        mainView.addSection(null, p);
    }

    mainView.displaySections();

    disableHold(onHold);
}

async function reviewsRoute() {
    mainView.setTitle("Review History");

    showLoader();
    let response = await sameOriginGetRequest(userEndpoint, {
        "history_type": "reviews"
    });
    let data = await response.json();
    hideLoader();
    
    if (!(response.status>=200 && response.status<300)) {
        makeToast("failure", data.error, 3000);
        return;
    }

    if (data.length > 0) {
        let discountsTable = new TableCreator(["Product name", "Shop", "Price", "Rating", "Submitted by", "Submission Date", "Expiry Date", "Time", "Active"]);
        
        for (let row of data) {
            let pDate = new Date(row.posted);
            let ratingIcon = document.createElement("span");
            ratingIcon.classList.add("material-icons");
            ratingIcon.innerText = row.rating === "like" ? "thumb_up" : "thumb_down";

            discountsTable.appendRow([row.product_name, row.name === null ? row.shop_id : row.name, row.cost + "€", ratingIcon, row.username, pDate.toLocaleDateString(), new Date(row.expiry).toLocaleDateString(), pDate.toLocaleTimeString(), row.expired ? "No" : "Yes"]);
        }
        
        
        mainView.addSection(null, discountsTable.getTable(), ["table-page-section"]);
    } else {
        let p = document.createElement("p");
        p.innerHTML = "No review history found.";
        p.classList.add("no-results");
        mainView.addSection(null, p);
    }

    mainView.displaySections();

    disableHold(onHold);
}

async function statisticsRoute() {
    mainView.setTitle("Statistics");
    showLoader();
    let response = await sameOriginGetRequest(userEndpoint, {
        "history_type": "score_data"
    });
    let data = await response.json();
    hideLoader();
    if (!(response.status>=200 && response.status<300)) {
        makeToast("failure", data.error, 3000);
        return;
    }

    let reviewScore = document.createElement("p");
    reviewScore.classList.add("score-text");
    reviewScore.innerHTML = data.review_score;
    mainView.addSection("Review score (month)", reviewScore);

    let reviewScoreTotal = document.createElement("p");
    reviewScoreTotal.classList.add("score-text");
    reviewScoreTotal.innerHTML = data.total_review_score;
    mainView.addSection("Total review score", reviewScoreTotal);

    let tokens = document.createElement("p");
    tokens.classList.add("tokens-text");
    tokens.innerHTML = data.tokens;
    mainView.addSection("Tokens (month)", tokens);

    let tokensTotal = document.createElement("p");
    tokensTotal.classList.add("tokens-text");
    tokensTotal.innerHTML = data.total_tokens;
    mainView.addSection("Total tokens", tokensTotal);

    mainView.displaySections();

    disableHold(onHold);
}
