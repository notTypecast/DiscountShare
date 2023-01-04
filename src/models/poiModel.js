import fs from "fs/promises";
import { promiseQuery } from "../util/query.js";

async function updatePOIsFromFile(filepath) {
    let data = await fs.readFile(filepath);
    const jsonData = JSON.parse(data);

    const POIs_sql = "INSERT INTO shop(id, shop_type, latitude, longitude, name, website, brand, phone_number) VALUES ? ON DUPLICATE KEY UPDATE \
    shop_type = VALUES(shop_type), name = VALUES(name), website = VALUES(website), brand = VALUES(brand), phone_number = VALUES(phone_number)";
    const POI_data = jsonData.features.map(feature => [feature.properties["@id"], feature.properties.shop.includes("convenience") ? "convenience" : "supermarket", 
        feature.geometry.coordinates[1], feature.geometry.coordinates[0], feature.properties.name, feature.properties.website,
        feature.properties.brand, feature.properties.phone]);

    await promiseQuery(POIs_sql, [POI_data]);
}

export { updatePOIsFromFile };