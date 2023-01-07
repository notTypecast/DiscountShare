import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import mysql from "mysql";
import cors from "cors";
import { TimedEventGroup, discountEventHandler, monthlyTokensEventHandler } from "./util/events.js";
import { getDatetimeFromObject, getNextMonthDate } from "./util/date.js";
import { requireAuth, requireAdmin } from "./middleware/requireAuth.js";
import { loggedIn } from "./middleware/loggedIn.js";

dotenv.config();
const app = express();
global.pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "DiscountShare",
    dateStrings: true
});

global.DEBUG_EDIT_DISCOUNTS = false;

global.discountEventGroup = new TimedEventGroup(0, discountEventHandler);
global.monthlyTokensEventGroup = new TimedEventGroup(1, monthlyTokensEventHandler);

(async () => {
    await global.discountEventGroup.initialize();
    await global.monthlyTokensEventGroup.initialize();
    // set initial event if it doesn't exist
    if (global.monthlyTokensEventGroup.current_event === null) {
        global.monthlyTokensEventGroup.addEvent(getDatetimeFromObject(getNextMonthDate()));
    }
})();

import { registerRouter } from "./routes/register.js";
import { loginRouter } from "./routes/login.js";
import { shopsRouter } from "./routes/shops.js";
import { categoriesRouter } from "./routes/categories.js"
import { discountsRouter } from "./routes/discounts.js";
import { productsRouter } from "./routes/products.js";
import { userRouter } from "./routes/user.js";
import { adminRouter } from "./routes/admin.js";

app.use(cors());
app.use(cookieParser());
app.use(express.json({limit: '50mb'}));
app.use("/api/", registerRouter);
app.use("/api/", loginRouter);
app.use("/api/", shopsRouter);
app.use("/api/", categoriesRouter);
app.use("/api/", discountsRouter);
app.use("/api/", productsRouter);
app.use("/api/", userRouter);
app.use("/api/", adminRouter);

app.get("/", requireAuth);
app.get("/account", requireAuth);
app.get("/login", loggedIn);
app.get("/admin", requireAdmin);
app.use(express.static("src/public", {index: "main.html", extensions: ["html"]}));


app.listen(3000, () => console.log("Server has begun"));