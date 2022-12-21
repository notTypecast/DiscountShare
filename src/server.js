import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import mysql from "mysql";
import cors from "cors";
import { requireAuth } from "./middleware/requireAuth.js";
import { loggedIn } from "./middleware/loggedIn.js";
import {getShops} from "./models/shopModel.js";
import { updatePOIsFromFile } from "./models/poiModel.js";

dotenv.config();
const app = express();
global.pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "DiscountShare"
});


(async function() {
    await updatePOIsFromFile("data/POIs.json");
    await getShops();
})();

import {registerRouter} from "./routes/register.js";
import { loginRouter } from "./routes/login.js";
import { shopsRouter } from "./routes/shops.js";

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use("/api/", registerRouter);
app.use("/api/", loginRouter);
app.use("/api/", shopsRouter);

app.get("/", requireAuth);
app.get("/login", loggedIn);
app.use(express.static("src/public", {index: "main.html", extensions: ["html"]}));


app.listen(3000, () => console.log("Server has begun"));