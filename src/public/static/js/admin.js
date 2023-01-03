const pageTitle = document.querySelector(".page-title");
const logoutBtn = document.getElementById("logoutLink");
const burgerMenu = document.querySelector(".nav-burger-menu");

const adminEndpoint = "/api/admin";

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

let routes = {
    "Products": productsRoute,
    "Shops": shopsRoute,
    "Admin Statistics": adminStatisticsRoute,
    "Leaderboard": leaderboardRoute
};
let activeLink = document.querySelector(".nav-link-active");
productsRoute();

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

async function uploadFile(e, type) {
    e.preventDefault();
    let fileInput = document.getElementById(type + "Upload");
    let selectedFilename = fileInput.parentNode.querySelector(".internal-form-file-selected");
    let file = fileInput.files[0];
    if (file === undefined) {
        return;
    }
    showLoader();
    let response = await sameOriginPostRequest(adminEndpoint, {
        "type": type
    }, [file]);
    hideLoader();
    if (response.status>=200 && response.status<300) {
        let typeText = type.charAt(0).toUpperCase() + type.slice(1);
        fileInput.value = "";
        selectedFilename.innerText = "No file selected";
        makeToast("success", typeText + " successfully updated.", 3000);
    } else {

        let data = await response.json();
        makeToast("failure", data.error, 3000);
    }
}

async function productsRoute() {
    mainView.setTitle("Products");

    mainView.addSection("Upload Products", createUploadForm("productsUpload", (e) => {
        uploadFile(e, "products");
    }));

    mainView.addSection("Update Prices", createUploadForm("pricesUpload", (e) => {
        uploadFile(e, "prices");
    }));

    let deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-all-btn");
    deleteBtn.innerText = "Delete";
    deleteBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        let confirmation = confirm("Are you sure you want to delete all product data? This cannot be undone.");
        if (confirmation) {
            showLoader();
            let response = await sameOriginDeleteRequest(adminEndpoint, {
                "type": "products"
            });
            hideLoader();
            if (response.status>=200 && response.status<300) {
                makeToast("success", "Product data successfully deleted.", 3000);
            } else {
                let data = await response.json();
                makeToast("failure", data.error, 3000);
            }
        }
    });
    let deleteIcon = document.createElement("span");
    deleteIcon.classList.add("material-icons");
    deleteIcon.innerText = "delete";
    deleteBtn.prepend(deleteIcon);
    mainView.addSection("Delete Product Data", deleteBtn);

    mainView.displaySections();

    disableHold(onHold);
    

}

async function shopsRoute() {

}

async function adminStatisticsRoute() {}

async function leaderboardRoute() {}

