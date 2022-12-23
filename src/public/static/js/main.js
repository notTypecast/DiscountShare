const shopsEndpoint = "/api/shops";
const categoriesEndpoint = "/api/categories";
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
        // TODO add html and css for popups
        let popup = L.popup().setContent(createPopup({
            title: title,
            type: row.shop_type, // cannot be undefined
            brand: row.brand,
            website: row.website,
            phone_number: row.phone_number
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

    // "remove" name and id from properties since they are already dislayed as title
    properties.name = null;
    properties.id = null;

    for (let property in properties) {
        if (properties[property] !== null) {
            let node = document.createElement("p");
            node.classList.add("popup-property");
            node.innerHTML = property.charAt(0).toUpperCase() + property.slice(1) + ": <span>" 
                +properties[property].charAt(0).toUpperCase() + properties[property].slice(1)+ "</span>";
            popup.appendChild(node);
        }
    }

    let showDiscountsBtn = document.createElement("button");
    showDiscountsBtn.classList.add("popup-btn");
    showDiscountsBtn.innerText = "Show discounts";
    showDiscountsBtn.addEventListener("click", (e) => {
        alert("show");
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