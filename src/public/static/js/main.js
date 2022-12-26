const shopsEndpoint = "/api/shops";
const categoriesEndpoint = "/api/categories";
const discountsEndpoint = "/api/discounts";
const logoutBtn = document.getElementById("logoutBtn");
const filterHeader = document.getElementById("filtersHeader");
let selectedFilter = null;

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

  var redIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
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
            // TODO: make likes/dislikes clickable when appropriate
            // TODO: maybe change shop name color?
            showLoader();
            let response = await sameOriginGetRequest(discountsEndpoint, {
                "shop_id": shop_id
            });
            response = await response.json();
            let discountsWrap = document.createElement("div");
            discountsWrap.classList.add("discounts-wrap");
            for (let i =0; i < response.length; i++) {
                discountsWrap.appendChild(createDiscountCard(response[i], allowOffers, shop_id, i));
            }
            popupBody = discountsWrap;
            hideLoader();
        } else {
            popupBody = document.createElement("p");
            popupBody.classList.add("no-discounts");
            popupBody.innerText = "No discounts available.";
        }
        createPagePopup(document.body, popupHeader, popupBody);
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
    if (properties.in_stock) {
        stockStatus.innerText = "In stock";
    } else {
        stockStatus.innerText = "Out of stock";
    }
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
    card.appendChild(cardExpires);

    let cardUser = document.createElement("p");
    cardUser.classList.add("discount-user");
    let userIcon = document.createElement("span");
    userIcon.classList.add("material-icons");
    userIcon.innerText = "person";
    cardUser.appendChild(userIcon);
    cardUser.appendChild(document.createTextNode(properties.username + ", " 
        + properties.total_review_score));
    card.appendChild(cardUser);

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
    }

    cardBottomBar.appendChild(reviewWrap);
    card.appendChild(cardBottomBar);

    return card;
}

async function reviewDiscount(e,action, shop_id, product_name) {
    switch(action) {
        case "dislike":
        case "like":
            let target = e.target;
            let actionCopy = action;
            if (target.tagName == "SPAN") {
                target = target.parentElement;
            }
            
            if (target.classList.contains("discount-"+ action +"-active")) {
                action = "none";
            }
            let response = await sameOriginPatchRequest(discountsEndpoint, {
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
    }
}
