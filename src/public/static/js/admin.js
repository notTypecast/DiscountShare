const pageTitle = document.querySelector(".page-title");
const logoutBtn = document.getElementById("logoutLink");
const burgerMenu = document.querySelector(".nav-burger-menu");

const adminEndpoint = "/api/admin";

const currentDate = new Date();
const currentDay = currentDate.getDay();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth() + 1;
const startYear = 2021;

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

    mainView.addSection("Update Products", createUploadForm("productsUpload", (e) => {
        uploadFile(e, "products");
    }));

    mainView.addSection("Update Prices", createUploadForm("pricesUpload", (e) => {
        uploadFile(e, "prices");
    }));

    mainView.addSection("Delete Product Data", createDeleteButton("products", "Are you sure you want to delete all product data? This cannot be undone.", "Product data successfully deleted."));

    mainView.displaySections();

    disableHold(onHold);
    

}

async function shopsRoute() {
    mainView.setTitle("Shops");

    mainView.addSection("Update Shops", createUploadForm("poiUpload", (e) => {
        uploadFile(e, "poi");
    }));

    mainView.addSection("Delete Shop Data", createDeleteButton("poi", "Are you sure you want to delete all shop data? This cannot be undone.", "Shop data successfully deleted."));

    mainView.displaySections();

    disableHold(onHold);
}

async function adminStatisticsRoute() {
    mainView.setTitle("Admin Statistics");



    const dailyDiscountsWrap = document.createElement("div");
    dailyDiscountsWrap.classList.add("daily-discounts-graph-wrap");

    const dailyDiscountsSelectorsWrap = document.createElement("div");
    dailyDiscountsSelectorsWrap.classList.add("daily-discounts-selectors-wrap");
    

    const monthDropdown = createDropdown("internal-dropdown", "monthDropdown", [], "Please select a month");
    const currentYear = parseInt(currentDate.getFullYear());
    let yearsOptions = [];
    for (let i = currentYear; i >= startYear; --i) {
        yearsOptions.push(i);
    }
    const yearDropdown = createDropdown("internal-dropdown", "yearDropdown", yearsOptions, "Please select a year");

    function changeDailyYearSelectorEvent(e) {
        const currentMonth = parseInt(currentDate.getMonth()) + 1;

        const newOptions = (e.target.value == currentYear) ? months.slice(0, currentMonth) : months;
        updateDropdown(monthDropdown, newOptions, "Please select a month");
    }

    async function changeDailyMonthSelectorEvent(e, chart) {
        const month = e.target.selectedIndex;
        const year = parseInt(yearDropdown.value);


        const response = await sameOriginGetRequest(adminEndpoint, {
            "type": "discount_number",
            "year": year,
            "month_number": month
        });
        const data = await response.json();
        if (!response.status >= 200 && response.status < 300) {
            makeToast("failure", data.error, 3000);
            return;
        }
        let newLabels = [];
        let discountNumberData = [];
        let numberOfDays = monthDays[month-1];
        if (month == 2 && isLeapYear(year)) {
            numberOfDays++;
        }
        for (let i = 0; i < numberOfDays; i++) {
            newLabels.push(i+1);
            if (currentYear === year && month === currentMonth && i > currentDay) {
                discountNumberData[i] = null;
            } else {
                discountNumberData[i] = 0;
            }
        }
        data.map((obj) => {
            discountNumberData[obj.day-1] = obj.total_discounts;
        });

        chart.data.labels = newLabels;
        chart.data.datasets[0].data = discountNumberData;
        chart.update();
    }

    dailyDiscountsSelectorsWrap.appendChild(yearDropdown);
    dailyDiscountsSelectorsWrap.appendChild(monthDropdown);


    dailyDiscountsWrap.appendChild(dailyDiscountsSelectorsWrap);


    const dailyDiscountsGraphWrap = document.createElement("canvas");
    let labels = [];
    for (let i = 0; i < monthDays[1]; i++) {
        labels.push(i+1);
    }


    dailyDiscountsGraphWrap.classList.add("graph-wrap");
    const dailyDiscountsChart = new Chart(dailyDiscountsGraphWrap, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: '# of Discounts',
            data: labels,
            borderColor: '#266dd3',
            backgroundColor: '#8ebaf8',
            borderWidth: 2
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });

    dailyDiscountsWrap.appendChild(dailyDiscountsGraphWrap);

    monthDropdown.addEventListener("change", (e) => {
        changeDailyMonthSelectorEvent(e, dailyDiscountsChart);
    });
    yearDropdown.addEventListener("change", changeDailyYearSelectorEvent);
    yearDropdown.selectedIndex = 1;
    yearDropdown.value = currentYear;
    yearDropdown.dispatchEvent(new Event("change"));

    monthDropdown.selectedIndex = currentDate.getMonth()+1;
    monthDropdown.value = monthDropdown.options[monthDropdown.selectedIndex].value;
    monthDropdown.dispatchEvent(new Event("change"));

    mainView.addSection("Daily discounts", dailyDiscountsWrap);
    

    mainView.displaySections();

    disableHold(onHold);
}

async function leaderboardRoute() {}
