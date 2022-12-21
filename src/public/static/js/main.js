const shopsEndpoint = "/api/shops";
const logoutBtn = document.getElementById("logoutBtn");

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

function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition((position) => {
            resolve(position);
        }, (error) => {
            reject(error);
        });
    });
}

async function loadShops() {
    if ("geolocation" in navigator) {
        let position;
        try {
            position = await getCurrentPosition();
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
        } catch (err) {
            console.log(err);
        }
        showLoader
        mainMap.setView([latitude, longitude], 15);
    }

    let response = await sameOriginPostRequest(shopsEndpoint, {
        "longitude": longitude,
        "latitude": latitude
    });
    response = await response.json();

    let markersLayer = new L.LayerGroup();
    mainMap.addLayer(markersLayer);

    for (let row of response) {
        let loc = [row.latitude, row.longitude];
        let marker = L.marker(L.latLng(loc), {
            name: row.name,
            id: row.id,
            type: row.shop_type,
            brand: row.brand,
            website: row.website,
            phone_number: row.phone_number,
            icon: row.discountCount > 0 ? greenIcon : greyIcon
        });
        // TODO add html and css for popups
        let h1 = document.createElement("h1");
        h1.innerText = (row.name === null ? row.id : row.name);
        let pp = L.popup().setContent(h1);
        // marker.bindPopup(row.name === null ? row.id : row.name);
        marker.bindPopup(pp);
        marker.addTo(markersLayer);
    }

    hideLoader();

    console.log(response);
}

loadShops();
