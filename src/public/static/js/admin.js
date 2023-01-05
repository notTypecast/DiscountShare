const pageTitle = document.querySelector(".page-title");
const logoutBtn = document.getElementById("logoutLink");
const burgerMenu = document.querySelector(".nav-burger-menu");

const categoriesSelectDefault = "Select a category";
const subcategoriesSelectDefault = "Select a subcategory";

const adminEndpoint = "/api/admin";
const categoriesEndpoint = "/api/categories";

const g_categories = {};
let g_subcategories = {};

const currentDate = new Date();
const currentDay = currentDate.getDate();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth() + 1;
const startYear = 2021;

let selectedMonday = null;

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
    dailyDiscountsWrap.classList.add("discounts-graph-wrap");

    const dailyDiscountsSelectorsWrap = document.createElement("div");
    dailyDiscountsSelectorsWrap.classList.add("graph-selectors-wrap");
    

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

        let newLabels, discountNumberData;
        [newLabels, discountNumberData] = await getDailyDiscountNumber(month, year);

        chart.data.labels = newLabels;
        chart.data.datasets[0].data = discountNumberData;
        chart.update();
    }

    dailyDiscountsSelectorsWrap.appendChild(yearDropdown);
    dailyDiscountsSelectorsWrap.appendChild(monthDropdown);


    dailyDiscountsWrap.appendChild(dailyDiscountsSelectorsWrap);


    const dailyDiscountsGraphCanvas = document.createElement("canvas");

    let initLabels, initDiscountNumberData;
    [initLabels, initDiscountNumberData] = await getDailyDiscountNumber(currentMonth, currentYear);


    dailyDiscountsGraphCanvas.classList.add("graph-canvas");
    const dailyDiscountsChart = new Chart(dailyDiscountsGraphCanvas, {
        type: 'line',
        data: {
          labels: initLabels,
          datasets: [{
            label: '# of Discounts',
            data: initDiscountNumberData,
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

    dailyDiscountsWrap.appendChild(dailyDiscountsGraphCanvas);

    monthDropdown.addEventListener("change", (e) => {
        changeDailyMonthSelectorEvent(e, dailyDiscountsChart);
    });
    yearDropdown.addEventListener("change", changeDailyYearSelectorEvent);
    yearDropdown.selectedIndex = 1;
    yearDropdown.value = currentYear;
    yearDropdown.dispatchEvent(new Event("change"));

    monthDropdown.selectedIndex = currentDate.getMonth()+1;
    monthDropdown.value = monthDropdown.options[monthDropdown.selectedIndex].value;

    mainView.addSection("Discounts per month", dailyDiscountsWrap);

    const weeklyDiscountsSelectorsWrap = document.createElement("div");
    weeklyDiscountsSelectorsWrap.classList.add("graph-selectors-wrap");

    await loadCategories();

    // initialize selected monday with current week
    selectedMonday = getPreviousMonday(new Date());

    const categoryDropdown = createDropdown("internal-dropdown", "categoryDropdown", Object.keys(g_categories), categoriesSelectDefault);
    const subcategoryDropdown = createDropdown("internal-dropdown", "subcategoryDropdown", [], subcategoriesSelectDefault);

    async function changeCategorySelectorEvent(e, chart) {
        const category = e.target.value;
        let newLabels, discountNumberData;
        await loadSubcategories(g_categories[category]);
        updateDropdown(subcategoryDropdown, Object.keys(g_subcategories), "Please select a subcategory");
        [newLabels, discountNumberData] = await getWeeklyDiscountData(selectedMonday.getDate(), selectedMonday.getMonth(), selectedMonday.getFullYear(),g_categories[category]);

        chart.data.labels = newLabels;
        chart.data.datasets[0].data = discountNumberData;
        chart.update();

    }

    async function changeSubcategorySelectorEvent(e, chart) {
        const category = categoryDropdown.value;
        const subcategory = e.target.value;

        let newLabels, discountNumberData;
        [newLabels, discountNumberData] = await getWeeklyDiscountData(selectedMonday.getDate(), selectedMonday.getMonth(), selectedMonday.getFullYear(), g_categories[category], g_subcategories[subcategory]);

        chart.data.labels = newLabels;
        chart.data.datasets[0].data = discountNumberData;
        chart.update();
    }

    async function changeWeek(e, direction) {
        if (categoryDropdown.selectedIndex == 0) {
            return;
        }
        
        switch (direction) {
            case "left":
                selectedMonday.setDate(selectedMonday.getDate() - 1)
                break;
            case "right":
                let currDate = new Date();
                let nextMonday = new Date(selectedMonday);
                nextMonday.setDate(selectedMonday.getDate() + 7);
                if (currDate < nextMonday) {
                    return;
                }
                selectedMonday = nextMonday;
                break;
        }
        selectedMonday = getPreviousMonday(selectedMonday);

        if (subcategoryDropdown.selectedIndex == 0) {
            categoryDropdown.dispatchEvent(new Event("change"));
            return;
        }

        subcategoryDropdown.dispatchEvent(new Event("change"));
    }

    categoryDropdown.addEventListener("change", (e) => {
        changeCategorySelectorEvent(e, weeklyDiscountsChart);
    });

    subcategoryDropdown.addEventListener("change", (e) => {
        changeSubcategorySelectorEvent(e, weeklyDiscountsChart);
    });

    weeklyDiscountsSelectorsWrap.appendChild(categoryDropdown);
    weeklyDiscountsSelectorsWrap.appendChild(subcategoryDropdown);


    const weeklyDiscountsWrap = document.createElement("div");
    weeklyDiscountsWrap.classList.add("discounts-graph-wrap");
    const weeklyDiscountsCanvas = document.createElement("canvas");
    
    const weeklyDiscountsChart = new Chart(weeklyDiscountsCanvas, {
        type: 'line',
        data: {
          datasets: [{
            label: 'Percentage of Discounts',
            borderColor: '#fc620a',
            backgroundColor: '#fc8f50',
            borderWidth: 2
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              min: 0
            }
          }
        }
    });

    let clearSelectionText = document.createElement("a");
    clearSelectionText.classList.add("clear-selection-text");
    clearSelectionText.innerText = "Clear selections";
    clearSelectionText.addEventListener("click", () => {
        categoryDropdown.selectedIndex = 0;
        emptyDropdown(subcategoryDropdown, subcategoriesSelectDefault);
        selectedMonday = getPreviousMonday();
        weeklyDiscountsChart.data.labels = [];
        weeklyDiscountsChart.data.datasets[0].data = [];
        weeklyDiscountsChart.update();
    });

    weeklyDiscountsWrap.appendChild(clearSelectionText);
    weeklyDiscountsWrap.appendChild(weeklyDiscountsSelectorsWrap);


    const pagerWrap = document.createElement("div");
    pagerWrap.classList.add("internal-pager-wrap");
    
    const pagerLeft = document.createElement("span");
    pagerLeft.classList.add("material-icons");
    pagerLeft.innerText = "chevron_left";
    pagerLeft.addEventListener("click", (e) => changeWeek(e, "left"));

    const pagerRight = document.createElement("span");
    pagerRight.classList.add("material-icons");
    pagerRight.innerText = "chevron_right";
    pagerRight.addEventListener("click", (e) => changeWeek(e, "right"));



    pagerWrap.appendChild(pagerLeft);
    pagerWrap.appendChild(pagerRight);


    weeklyDiscountsWrap.appendChild(pagerWrap);
    weeklyDiscountsWrap.appendChild(weeklyDiscountsCanvas);






    mainView.addSection("Average discount percentage per day", weeklyDiscountsWrap);

    mainView.displaySections();

    disableHold(onHold);
}

async function leaderboardRoute() {}

async function getDailyDiscountNumber(month, year) {
    showLoader();
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
        if (currentYear === year && month === currentMonth && i >= currentDay) {
            discountNumberData[i] = null;
        } else {
            discountNumberData[i] = 0;
        }
    }
    data.map((obj) => {
        discountNumberData[obj.day-1] = obj.total_discounts;
    });
    hideLoader();

    return [newLabels, discountNumberData];
}

async function getWeeklyDiscountData(mondayDay, mondayMonth, mondayYear, categoryId, subcategory_id) {
    showLoader();
    const mondayDate = new Date(mondayYear, mondayMonth, mondayDay);
    const reqBody =  {
        "type": "weekly_discount",
        "start_date": getISODate(mondayDate),
        "category_id": categoryId
    }
    if (subcategory_id !== undefined) {
        reqBody["subcategory_id"] = subcategory_id;
    }
    const response = await sameOriginGetRequest(adminEndpoint, reqBody);
    const data = await response.json();

    if (!response.status >= 200 && response.status < 300) {
        makeToast("failure", data.error, 3000);
        return;
    }

    let newLabels = [];
    let weekData = [];
    let currDate = new Date();
    let tempDate = new Date(mondayDate);
    for (let i = 0; i < 7; ++i) {
        newLabels.push(tempDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }));
        if (tempDate > currDate) {
            tempDate.setDate(tempDate.getDate()+1);
            weekData.push(null);
            continue;
        }
        let dateData = data[getISODate(tempDate)];
        weekData.push(dateData === undefined ? 0 : dateData);
        tempDate.setDate(tempDate.getDate()+1);
    }

    hideLoader();
    return [newLabels, weekData];
}

async function loadCategories() {
    showLoader();
    const response = await sameOriginGetRequest(categoriesEndpoint, {});
    const data = await response.json();
    hideLoader();
    if (!response.status >= 200 && response.status < 300) {
        makeToast("failure", data.error, 3000);
        return;
    }
    data.map(obj => {
        g_categories[obj.name] = obj.id;
    });
}

async function loadSubcategories(categoryId) {
    showLoader();
    const response = await sameOriginGetRequest(categoriesEndpoint, {
        "category_id": categoryId
    });
    const data = await response.json();
    hideLoader();
    if (!response.status >= 200 && response.status < 300) {
        makeToast("failure", data.error, 3000);
        return;
    }
    g_subcategories = {};
    data.map(obj => {
        g_subcategories[obj.name] = obj.id;
    });
}


function getPreviousMonday(date = new Date()) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
}

function getISODate(dateObj = new Date()) {
    let tmp = dateObj.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    return tmp.slice(6, 10) + "-" + tmp.slice(3, 5) + "-" + tmp.slice(0, 2);  
}
