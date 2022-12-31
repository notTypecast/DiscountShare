import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import mysql from "mysql";
import cors from "cors";
import { requireAuth } from "./middleware/requireAuth.js";
import { loggedIn } from "./middleware/loggedIn.js";
import { getShops } from "./models/shopModel.js";
import { updatePOIsFromFile } from "./models/poiModel.js";
import { updateProductsFromFile } from "./models/productModel.js";
import { updatePricesFromFile } from "./models/priceModel.js";

dotenv.config();
const app = express();
global.pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "DiscountShare"
});

// TODO REMOVE THIS
(async function() {
    await updateProductsFromFile("data/products.json");
    await updatePricesFromFile("data/price_history.json");
    await updatePOIsFromFile("data/POIs.json");
})();

import { registerRouter } from "./routes/register.js";
import { loginRouter } from "./routes/login.js";
import { shopsRouter } from "./routes/shops.js";
import { categoriesRouter } from "./routes/categories.js"
import { discountsRouter } from "./routes/discounts.js";
import { productsRouter } from "./routes/products.js";
import { userRouter } from "./routes/user.js";

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use("/api/", registerRouter);
app.use("/api/", loginRouter);
app.use("/api/", shopsRouter);
app.use("/api/", categoriesRouter);
app.use("/api/", discountsRouter);
app.use("/api/", productsRouter);
app.use("/api/", userRouter);

app.get("/", requireAuth);
app.get("/login", loggedIn);
app.use(express.static("src/public", {index: "main.html", extensions: ["html"]}));


app.listen(3000, () => console.log("Server has begun"));