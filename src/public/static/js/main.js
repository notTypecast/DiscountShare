const shopsEndpoint = "/api/shops";
const categoriesEndpoint = "/api/categories";
const discountsEndpoint = "/api/discounts";
const productsEndpoint = "/api/products";
const logoutBtn = document.getElementById("logoutBtn");
const filterHeader = document.getElementById("filtersHeader");
const burgerMenu = document.querySelector(".nav-burger-menu");
let selectedFilter = null;
let currentShopId;

let categoriesData = {
    "cats": ["food", "toys"],
    "dogs": ["dog food", "dog toys", "shoes"],
    "birds": ["cages", "feeders"]
}

const categoriesSelectDefault = "Select a category";
const subcategoriesSelectDefault = "Select a subcategory";
const productsSelectDefault = "Select a product";
const searchDefault = "Search for a product";

filterHeader.addEventListener("click", (e) => {
    document.querySelector(".filters-wrap").classList.toggle("filters-active");;
    const icon = document.querySelector(".expand-icon")
    icon.innerText = icon.innerText === "expand_more" ? "expand_less" : "expand_more";
});

let greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

let greyIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

let redIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
  

burgerMenu.addEventListener("click", (e) => {
    document.querySelector(".nav-btn-container").classList.toggle("nav-btn-container-visible");
});

logoutBtn.addEventListener("click", (e) => {
    deleteAllCookies();
    window.location.href = "/login";
});

let mainMap = L.map('map', {attributionControl: false});
let mainTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
mainTiles.addTo(mainMap);


// default spawn location
let latitude = 38.2904432847599;
let longitude = 21.79570161166583;
let gotPos = null;
let posMarker = false;
let markersGroup = new L.LayerGroup();

loadShops();
createFiltersList();

function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition((position) => {
            gotPos = true;
            resolve(position);
        }, (error) => {
            gotPos = false;
            reject(error);
        });
    });
}

async function loadShops(category_id) {
    if (gotPos === null) {
        if ("geolocation" in navigator) {
            let position;
            
            try {
                position = await getCurrentPosition();
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
            } catch (err) {
                console.log(err);
            }
            mainMap.setView([latitude, longitude], 15);
        }

        let controlSearch = new L.Control.Search({
            position: "topright",
            layer: markersGroup,
            initial: false,
            zoom: 30,
            marker: false,
            propertyName: "title",
            circleLocation: false,
            debug: true
        });
        mainMap.addControl(controlSearch);
    }
    else {
        markersGroup.clearLayers();
    }

    showLoader();

    let response = await sameOriginGetRequest(shopsEndpoint, {
        "longitude": longitude,
        "latitude": latitude,
        "category_id": category_id
    });
    response = await response.json();

    mainMap.addLayer(markersGroup);

    addUserPositionMarker();

    titles = {};

    for (let row of response) {
        let title = row.name === null ? row.id : row.name;
        if (titles[title] !== undefined) {
            title += " " + ++titles[title];
        }

        let loc = [row.latitude, row.longitude];
        let marker = L.marker(L.latLng(loc), {
            title: title,
            icon: row.discountCount > 0 ? greenIcon : greyIcon
        });
        let popup = L.popup().setContent(createPopup({
            id: row.id,
            title: title,
            type: row.shop_type, // cannot be undefined
            brand: row.brand,
            website: row.website,
            phone_number: row.phone_number,
            discountCount: row.discountCount,
            allowOffers: row.allowOffers
        }));
        marker.bindPopup(popup);
        marker.addTo(markersGroup);
        if (titles[title] === undefined) {
            titles[title] = 1;
        }
        else {
            ++titles[title];
        }
    }

    hideLoader();
}

function createPopup(properties) {
    let popup = document.createElement("div");
    popup.classList.add("popup");
    
    let titleNode = document.createElement("h3");
    titleNode.classList.add("popup-title");
    titleNode.innerText = properties.title;
    popup.appendChild(titleNode);

    let discountCount = properties.discountCount;
    let shop_id = properties.id;
    let allowOffers = properties.allowOffers;
    // "remove" name and id from properties since they are already dislayed as title
    properties.name = null;
    properties.id = null;
    properties.discountCount = null;
    properties.allowOffers = null;

    for (let property in properties) {
        if (properties[property] !== null) {
            let node = document.createElement("p");
            node.classList.add("popup-property");
            let propertyName = property.replace("_", " ");
            node.innerHTML = propertyName.charAt(0).toUpperCase() + propertyName.slice(1) + ": <span>" 
                +properties[property].charAt(0).toUpperCase() + properties[property].slice(1)+ "</span>";
            popup.appendChild(node);
        }
    }

    let showDiscountsBtn = document.createElement("button");
    showDiscountsBtn.classList.add("popup-btn");
    showDiscountsBtn.innerText = "Show discounts";
    showDiscountsBtn.addEventListener("click", async (e) => {
        let popupHeader = document.createElement("h2");
        popupHeader.innerHTML = "Showing discounts for <span>" + properties.title + "</span>";

        let popupBody;
        if (discountCount > 0) {
            showLoader();
            popupBody = await loadDiscounts(shop_id, allowOffers);
            hideLoader();
        } else {
            popupBody = document.createElement("p");
            popupBody.classList.add("no-discounts");
            popupBody.innerText = "No discounts available.";
        }
        currentShopId = shop_id;
        createPagePopup(document.body, popupHeader, allowOffers? withAddDiscountFunctionality(popupBody) : [popupBody]);
    });
    popup.appendChild(showDiscountsBtn);

    return popup;
}

function addUserPositionMarker() {
    if (gotPos && !posMarker) {
        // add user position marker
        let marker = L.marker(L.latLng([latitude, longitude]), {
            icon: redIcon
        });
        let posTitle = document.createElement("h3");
        posTitle.classList.add("popup-title");
        posTitle.innerText = "Your position";
        let popup = L.popup().setContent(posTitle);
        marker.bindPopup(popup);
        marker.addTo(mainMap);

        // add circle around user position to indicate discount area
        L.circle([latitude, longitude], {
            color: "red",
            radius: 50
        }).addTo(mainMap);
        posMarker = true;
    }
}


async function createFiltersList() {
    const filterList = document.getElementById("filterList");

    const response = await sameOriginGetRequest(categoriesEndpoint, {});
    const results = await response.json()

    for (let category of results) {
        const listItem = document.createElement("li");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "filters";
        input.id = category.id;
        input.value = category.id;
        const label = document.createElement("label");
        label.innerHTML = category.name;
        label.setAttribute("for", category.id);

        listItem.appendChild(input);
        listItem.appendChild(label);
        filterList.appendChild(listItem);

        label.addEventListener("click", async (e) => {
            let label = e.target;
            let id = label.getAttribute("for");
            let input = document.getElementById(id);

            if (selectedFilter === e.target) {
                id = undefined;
                label.classList.remove("checkedLabel");
                selectedFilter = null;
            } 
            else {
                selectedFilter = (selectedFilter !== null) ? selectedFilter : e.target;
                selectedFilter.classList.remove("checkedLabel");
                label.classList.add("checkedLabel");
                selectedFilter = e.target;
            }
            loadShops(id);
        });
    }
}


function createDiscountCard(properties, allowOffers, shop_id, index) {
    let card = document.createElement("div");
    card.classList.add("discount");
    card.id = "discount-" + index;

    let cardTopBar = document.createElement("div");
    cardTopBar.classList.add("discount-top-bar");
    let iconwrap = document.createElement("div");
    let icon;
    switch (properties.condition_value) {
        case 2:
            icon = document.createElement("span");
            icon.classList.add("discount-day-deal");
            icon.classList.add("material-icons");
            icon.setAttribute("title", "This price is at least 20% off the average price of the product in the last day.");
            icon.innerText = "local_fire_department";
            iconwrap.appendChild(icon);
            break;
        case 1:
            icon = document.createElement("span");
            icon.classList.add("discount-week-deal");
            icon.classList.add("material-icons");
            icon.setAttribute("title", "This price is at least 20% off the average price of the product in the last week.");
            icon.innerText = "price_change";
            iconwrap.appendChild(icon);
            break;
    }
    cardTopBar.appendChild(iconwrap);
    let stockStatus = document.createElement("p");
    stockStatus.classList.add("discount-stock-status");
    stockStatus.innerText = "In stock";
    cardTopBar.appendChild(stockStatus);
    card.append(cardTopBar);

    let cardBanner = document.createElement("img");
    cardBanner.classList.add("discount-banner");
    cardBanner.src = properties.image_link;
    card.appendChild(cardBanner);

    let cardTitle = document.createElement("h4");
    cardTitle.classList.add("discount-title");
    cardTitle.innerText = properties.product_name;
    card.appendChild(cardTitle);

    let cardDate = document.createElement("p");
    cardDate.classList.add("discount-date");
    let dateIcon = document.createElement("span");
    dateIcon.classList.add("material-icons");
    dateIcon.innerText = "calendar_today";
    cardDate.appendChild(dateIcon);

    let date = new Date(properties.posted);
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let fPostedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    cardDate.appendChild(document.createTextNode(fPostedDate));
    cardDate.setAttribute("title", "Date posted");
    card.appendChild(cardDate);

    let cardExpires = document.createElement("p");
    cardExpires.classList.add("discount-date");
    let expiresIcon = document.createElement("span");
    expiresIcon.classList.add("material-icons");
    expiresIcon.innerText = "timer";
    cardExpires.appendChild(expiresIcon);

    date = new Date(properties.expiry);
    year = date.getFullYear();
    month = date.getMonth() + 1;
    day = date.getDate();
    hours = date.getHours();
    minutes = date.getMinutes();
    fExpiryDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    cardExpires.appendChild(document.createTextNode(fExpiryDate));
    cardExpires.setAttribute("title", "Expiry date");
    card.appendChild(cardExpires);

    let cardUser = document.createElement("p");
    cardUser.classList.add("discount-user");
    let userIcon = document.createElement("span");
    userIcon.classList.add("material-icons");
    userIcon.innerText = "person";
    cardUser.appendChild(userIcon);
    cardUser.appendChild(document.createTextNode(properties.username));
    cardUser.setAttribute("title", "User discount was posted by");
    card.appendChild(cardUser);

    let cardReputation = document.createElement("p");
    cardReputation.classList.add("discount-user");
    let reputationIcon = document.createElement("span");
    reputationIcon.classList.add("material-icons");
    reputationIcon.innerText = "reviews";
    cardReputation.appendChild(reputationIcon);
    cardReputation.appendChild(document.createTextNode(properties.total_review_score));
    cardReputation.setAttribute("title", "User's total review score");
    card.appendChild(cardReputation);

    let cardBottomBar = document.createElement("div");
    cardBottomBar.classList.add("discount-bottom-bar");
    let cardPrice = document.createElement("p");
    cardPrice.classList.add("discount-price");
    cardPrice.innerText = properties.cost + "€";
    cardBottomBar.appendChild(cardPrice);

    let reviewWrap = document.createElement("div");
    reviewWrap.classList.add("discount-review-wrap");
    let likes  = document.createElement("p");
    likes.setAttribute("title", "Like this discount");
    likes.classList.add("discount-review-btn");
    likes.setAttribute("data-action", "like");
    if (properties.current_rating === "like") {
        likes.classList.add("discount-like-active");
    }
    let likeIcon = document.createElement("span");
    likeIcon.classList.add("material-icons");
    likeIcon.innerText = "thumb_up";
    likes.appendChild(likeIcon);
    likes.appendChild(document.createTextNode(properties.likes));
    reviewWrap.appendChild(likes);
    let dislikes = document.createElement("p");
    dislikes.setAttribute("title", "Dislike this discount");
    dislikes.classList.add("discount-review-btn");
    dislikes.setAttribute("data-action", "like");
    if (properties.current_rating === "dislike") {
        dislikes.classList.add("discount-dislike-active");
    }
    let dislikeIcon = document.createElement("span");
    dislikeIcon.classList.add("material-icons");
    dislikeIcon.innerText = "thumb_down";
    dislikes.appendChild(dislikeIcon);
    dislikes.appendChild(document.createTextNode(properties.dislikes));
    reviewWrap.appendChild(dislikes);
    let markOos = document.createElement("p");
    markOos.classList.add("discount-review-btn");
    markOos.setAttribute("title", "Mark this product as out of stock");
    markOos.setAttribute("data-action", "mark_oos");
    let markOosIcon = document.createElement("span");
    markOosIcon.classList.add("material-icons");
    markOosIcon.innerText = "production_quantity_limits";
    markOos.appendChild(markOosIcon);
    reviewWrap.appendChild(markOos);

    if (allowOffers) {
        likes.classList.add("discount-review-btn-allowed");
        likes.addEventListener("click", async (e) => {
            await reviewDiscount(e, "like", shop_id, properties.product_name);
        });
        dislikes.classList.add("discount-review-btn-allowed");
        dislikes.addEventListener("click", async (e) => {
            await reviewDiscount(e, "dislike", shop_id, properties.product_name);
        });
        markOos.classList.add("discount-review-btn-allowed");
        markOos.addEventListener("click", async (e) => {
            await reviewDiscount(e, "mark_oos", shop_id, properties.product_name);
        });

    }

    cardBottomBar.appendChild(reviewWrap);
    card.appendChild(cardBottomBar);

    if (!properties.in_stock) {
        markDiscountOutOfStockUI(card, generateMarkBackInStockEvent(card, shop_id, properties.product_name));
    }
    return card;
}

async function reviewDiscount(e, action, shop_id, product_name) {
    let target = e.target;
    let actionCopy = action;
    if (target.tagName == "SPAN") {
        target = target.parentElement;
    }
    let response;
    switch(action) {
        case "dislike":
        case "like":
            if (target.classList.contains("discount-"+ action +"-active")) {
                action = "none";
            }

            let complementaryAction = (action === "like") ? "dislike" : "like";
            let complementaryBtn = target.parentElement.querySelector(".discount-"+ complementaryAction +"-active");
            if (complementaryBtn !== null) {
                complementaryBtn.classList.remove("discount-"+ complementaryAction +"-active");
                let count = complementaryBtn.childNodes[1];
                count.nodeValue = (parseInt(count.nodeValue) - 1 < 0) ? 0 : parseInt(count.nodeValue) - 1;
            }

            response = await sameOriginPatchRequest(discountsEndpoint, {
                rating: action,
                shop_id: shop_id,
                product_name: product_name,
                longitude: longitude,
                latitude: latitude,
            });
            if (response.status>=200 && response.status<300) {
                let count = target.childNodes[1];
                if (action === "none") {
                    target.classList.remove("discount-"+ actionCopy +"-active");
                    count.nodeValue = (parseInt(count.nodeValue) - 1 < 0) ? 0 : parseInt(count.nodeValue) - 1;
                } else {
                    target.classList.add("discount-"+ action +"-active");
                    count.nodeValue = parseInt(count.nodeValue) + 1;
                }
            }
            else if (response.status === 403) {
                data = await response.json();
                makeToast("failure", data.error, 3000);
            }
            break;
        
        case "mark_oos":
            response = await sameOriginPatchRequest(discountsEndpoint, {
                shop_id: shop_id,
                product_name: product_name,
                longitude: longitude,
                latitude: latitude,
                in_stock: 0
            });
            if (response.status>=200 && response.status<300) {
                let disc = target.parentElement;
                while (!disc.classList.contains("discount")) disc = disc.parentElement;
                markDiscountOutOfStockUI(disc, generateMarkBackInStockEvent(disc, shop_id, product_name));
            }
            break;
    }
}

function markDiscountOutOfStockUI(discountNode, bisEvent) {
    let stockStatus = discountNode.querySelector(".discount-stock-status");
    stockStatus.innerText = "Out of stock";
    stockStatus.classList.add("discount-out-of-stock");

    discountNode.classList.add("discount-oos");

    let discountBanner = discountNode.querySelector(".discount-banner");
    discountBanner.classList.add("discount-banner-oos");

    let discountTitle = discountNode.querySelector(".discount-title");
    discountTitle.classList.add("discount-title-oos");

    
    let markOos = discountNode.querySelector(".discount-review-btn[data-action='mark_oos']");
    markOos.classList.add("discount-review-btn-oos");

    let markBis = document.createElement("p");
    markBis.classList.add("discount-mark-bis");
    markBisIcon = document.createElement("span");
    markBisIcon.classList.add("material-icons");
    markBisIcon.innerText = "add_shopping_cart";
    markBis.appendChild(markBisIcon);
    markBis.appendChild(document.createTextNode("Mark back in stock"));
    discountNode.querySelector(".discount-review-wrap").appendChild(markBis);
    markBis.addEventListener("click", bisEvent);

}

function markDiscountBackInStockUI(discountNode) {
    let stockStatus = discountNode.querySelector(".discount-stock-status");
    stockStatus.innerText = "In stock";
    stockStatus.classList.remove("discount-out-of-stock");

    discountNode.classList.remove("discount-oos");

    let discountBanner = discountNode.querySelector(".discount-banner");
    discountBanner.classList.remove("discount-banner-oos");

    let discountTitle = discountNode.querySelector(".discount-title");
    discountTitle.classList.remove("discount-title-oos");

    let markOos = discountNode.querySelector(".discount-review-btn[data-action='mark_oos']");
    markOos.classList.remove("discount-review-btn-oos");

    let markBis = discountNode.querySelector(".discount-mark-bis");
    markBis.remove();
}

function generateMarkBackInStockEvent(discountNode, shop_id, product_name) {
    return async (e) => {
        response = await sameOriginPatchRequest(discountsEndpoint, {
            shop_id: shop_id,
            product_name: product_name,
            longitude: longitude,
            latitude: latitude,
            in_stock: 1
        });
        if (response.status>=200 && response.status<300) {
            markDiscountBackInStockUI(discountNode);
        }
    }
}

function withAddDiscountFunctionality(bodyNode) {
    let discAddWrap = document.createElement("div");
    discAddWrap.classList.add("discount-add-wrap");

    let discAddBtn = document.createElement("a");
    discAddBtn.classList.add("discount-add-btn");
    discAddBtn.id = "addDiscountBtn";
    let discAddBtnIcon = document.createElement("span");
    discAddBtnIcon.classList.add("material-icons");
    discAddBtnIcon.innerText = "add";
    discAddBtn.appendChild(discAddBtnIcon);

    discAddWrap.appendChild(discAddBtn);
    
    discAddBtn.addEventListener("click", (e) => {
        createDiscountModal(discAddWrap);
        let target = e.target;
        if (target.tagName == "SPAN") {
            target = target.parentElement;
        }
        target.classList.add("discount-add-btn-inactive");
    });

    return [discAddWrap, bodyNode]
}

function createDiscountModal(discAddWrap, properties) {
    let discAddForm = document.createElement("div");
    discAddForm.classList.add("discount-add-form");

    // create "clear" button
    let discAddClear = document.createElement("a");
    discAddClear.classList.add("discount-add-clear");
    discAddClear.innerText = "Clear selections";
    discAddClear.addEventListener("click", clearSelections);
    discAddForm.appendChild(discAddClear);

    let catDropdown = createDropdown("discount-categories-dropdown", "catDropdown", Object.keys(categoriesData), "Select a category");
    catDropdown.addEventListener("change", categoryChangeEvent);
    discAddForm.appendChild(catDropdown);

    let subcatDropdown = createDropdown("discount-categories-dropdown", "subcatDropdown", [] ,"Select a subcategory");
    subcatDropdown.addEventListener("change", subcategoryChangeEvent);
    discAddForm.appendChild(subcatDropdown);

    discAddForm.appendChild(createDropdown("discount-categories-dropdown", "prodDropdown",[] ,"Select a product"));

    discAddWrap.appendChild(discAddForm);

    let discAddOr = document.createElement("span");
    discAddOr.classList.add("discount-add-or");
    discAddOr.innerText = "or";
    discAddForm.appendChild(discAddOr);

    /*
                <div class="discount-add-search-wrap">
              <div class="discount-add-search-element">
                <input type="text" class="discount-add-search" placeholder="Search for a product">
                <span class="material-icons search-btn">search</span>
              </div>
              <div class="discount-add-search-results-wrap">
                <span class="discount-add-search-result"><img src="https://warply.s3.amazonaws.com/applications/ed840ad545884deeb6c6b699176797ed/products/Ready2U_%CE%9C%CE%AC%CF%83%CE%BA%CE%B5%CF%82_%CE%A0%CF%81%CE%BF%CF%83%CF%84%CE%B1%CF%83%CE%AF%CE%B1%CF%82_%CE%A0%CF%81%CE%BF%CF%83%CF%8E%CF%80%CE%BF%CF%85_50%CF%84%CE%B5%CE%BC.jpg">Pipoproion</span>
                <span class="discount-add-search-result"><img src="https://warply.s3.amazonaws.com/applications/ed840ad545884deeb6c6b699176797ed/products/Ready2U_%CE%9C%CE%AC%CF%83%CE%BA%CE%B5%CF%82_%CE%A0%CF%81%CE%BF%CF%83%CF%84%CE%B1%CF%83%CE%AF%CE%B1%CF%82_%CE%A0%CF%81%CE%BF%CF%83%CF%8E%CF%80%CE%BF%CF%85_50%CF%84%CE%B5%CE%BC.jpg">Pipoproioni me onoma aa dsfjdjfjd dsd f df dsfsdfsfds</span>
              </div>
            </div>
    */
    
    let discAddSearchWrap = document.createElement("div");
    discAddSearchWrap.classList.add("discount-add-search-wrap");
    let discAddSearchElement = document.createElement("div");
    discAddSearchElement.classList.add("discount-add-search-element");

    let discAddSearch = document.createElement("input");
    discAddSearch.classList.add("discount-add-search");
    discAddSearch.id = "discountAddSearch";
    discAddSearch.placeholder = "Search for a product";
    discAddSearch.addEventListener("keydown", (e) => {
        if (e.key == "Enter") {
            searchProducts(e);
        }
    });
    discAddSearchElement.appendChild(discAddSearch);

    let discAddSearchBtn = document.createElement("span");
    discAddSearchBtn.classList.add("material-icons");
    discAddSearchBtn.classList.add("search-btn");
    discAddSearchBtn.innerText = "search";
    discAddSearchBtn.addEventListener("click", searchProducts);


    discAddSearchElement.appendChild(discAddSearchBtn);
    discAddSearchWrap.appendChild(discAddSearchElement);
    let discAddSearchResultsWrap = document.createElement("div");
    discAddSearchResultsWrap.classList.add("discount-add-search-results-wrap");
    discAddSearchResultsWrap.id = "discountAddSearchResultsWrap";
    // TODO: add search results and event listener
    discAddSearchWrap.appendChild(discAddSearchResultsWrap);
    discAddForm.appendChild(discAddSearchWrap);

    /*
    <input type="text" placeholder="Price (€)" class="discount-add-price">
    <button class="discount-add-submit">Add discount</button>
    */
    let discAddPrice = document.createElement("input");
    discAddPrice.type = "text";
    discAddPrice.placeholder = "Price (€)";
    discAddPrice.classList.add("discount-add-price");
    discAddForm.appendChild(discAddPrice);
    let discAddSubmit = document.createElement("button");
    discAddSubmit.classList.add("discount-add-submit");
    discAddSubmit.innerText = "Add discount";
    discAddForm.appendChild(discAddSubmit);
    discAddSubmit.addEventListener("click", addDiscount);

}

function categoryChangeEvent(e) {
    let target = e.target;
    let subcatDropdown = target.parentElement.querySelector("#subcatDropdown");
    let prodDropdown = target.parentElement.querySelector("#prodDropdown");
    let searchBar = target.parentElement.querySelector(".discount-add-search");

    searchBar.setAttribute("placeholder", "Search in " + target.value);

    updateDropdown(subcatDropdown, categoriesData[target.value], subcategoriesSelectDefault);
    emptyDropdown(prodDropdown, productsSelectDefault);
}

function subcategoryChangeEvent(e) {
    let target = e.target;
    let prodDropdown = target.parentElement.querySelector("#prodDropdown");
    let catDropdown = target.parentElement.querySelector("#catDropdown");
    let searchBar = target.parentElement.querySelector(".discount-add-search");

    searchBar.setAttribute("placeholder", "Search in " + target.value + ", " + catDropdown.value);

    updateDropdown(prodDropdown, [], productsSelectDefault);
}

function clearSelections(e) {
    let target = e.target;
    let catDropdown = target.parentElement.querySelector("#catDropdown");
    let subcatDropdown = target.parentElement.querySelector("#subcatDropdown");
    let prodDropdown = target.parentElement.querySelector("#prodDropdown");
    let searchBar = target.parentElement.querySelector(".discount-add-search");
    let resultsWrap = document.getElementById("discountAddSearchResultsWrap");

    // revert to default, since categories should not be cleared
    catDropdown.selectedIndex = 0;
    emptyDropdown(subcatDropdown, subcategoriesSelectDefault);
    emptyDropdown(prodDropdown, productsSelectDefault);

    searchBar.setAttribute("placeholder", searchDefault);
    searchBar.value = "";
    resultsWrap.innerText = "";

}

async function searchProducts(e) {
    let target = e.target;
    let searchBar = target.parentElement.querySelector("#discountAddSearch");
    let catDropdown = target.parentElement.querySelector("#catDropdown");
    let subcatDropdown = target.parentElement.querySelector("#subcatDropdown");
    let prodDropdown = target.parentElement.querySelector("#prodDropdown");
    let searchResults = document.querySelector("#discountAddSearchResultsWrap");

    let searchQuery = searchBar.value;

    if (searchQuery.length == 0) {
        searchResults.innerText = "";
        return;
    } else if (searchQuery.length < 3) {
        searchResults.innerText = "Search query must be at least 3 characters long.";
        return;
    }

    showLoader();
    // TODO: maybe change way of returning error
    let response = await sameOriginGetRequest(productsEndpoint, {
        "search_term": searchQuery
    });
    
    let products = await response.json();
    hideLoader();

    searchResults.innerText = "";
    if (products.length == 0) {
        searchResults.innerText = "No products found.";
        return;
    }
    for (let product of products) {
        /*

        <div class="discount-add-search-results-wrap">
        <span class="discount-add-search-result"><img src="https://warply.s3.amazonaws.com/applications/ed840ad545884deeb6c6b699176797ed/products/Ready2U_%CE%9C%CE%AC%CF%83%CE%BA%CE%B5%CF%82_%CE%A0%CF%81%CE%BF%CF%83%CF%84%CE%B1%CF%83%CE%AF%CE%B1%CF%82_%CE%A0%CF%81%CE%BF%CF%83%CF%8E%CF%80%CE%BF%CF%85_50%CF%84%CE%B5%CE%BC.jpg">Pipoproion</span>
        <span class="discount-add-search-result"><img src="https://warply.s3.amazonaws.com/applications/ed840ad545884deeb6c6b699176797ed/products/Ready2U_%CE%9C%CE%AC%CF%83%CE%BA%CE%B5%CF%82_%CE%A0%CF%81%CE%BF%CF%83%CF%84%CE%B1%CF%83%CE%AF%CE%B1%CF%82_%CE%A0%CF%81%CE%BF%CF%83%CF%8E%CF%80%CE%BF%CF%85_50%CF%84%CE%B5%CE%BC.jpg">Pipoproioni me onoma aa dsfjdjfjd dsd f df dsfsdfsfds</span>
        </div>
        */
        let productResult = document.createElement("span");
        productResult.classList.add("discount-add-search-result");
        let productImage = document.createElement("img");
        productImage.src = product.image_link;
        productResult.appendChild(productImage);
        productResult.appendChild(document.createTextNode(product.name));
        productResult.addEventListener("click", (e) => {
            let resultsWrap = document.querySelector("#discountAddSearchResultsWrap");
            resultsWrap.innerText = "";
            let selected = document.createElement("span");
            selected.id = "selectedSearchResult";
            selected.classList.add("discount-add-search-result-selected");
            let productImage = document.createElement("img");
            productImage.src = product.image_link;
            selected.appendChild(productImage);
            selected.appendChild(document.createTextNode(product.name));
            resultsWrap.append(selected);
        });
        searchResults.appendChild(productResult);
    }


}

async function loadDiscounts(shop_id, allowOffers) {
    let response = await sameOriginGetRequest(discountsEndpoint, {
        "shop_id": shop_id
    });
    response = await response.json();
    let discountsWrap = document.createElement("div");
    discountsWrap.classList.add("discounts-wrap");
    for (let i =0; i < response.length; i++) {
        discountsWrap.appendChild(createDiscountCard(response[i], allowOffers, shop_id, i));
    }
    return discountsWrap;
}

async function addDiscount(e) {

}