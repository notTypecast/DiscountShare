import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import mysql from "mysql";

dotenv.config();
const app = express();
global.pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'DiscountShare'
});

import {registerRouter} from "./routes/register.js";

app.use(cookieParser());
app.use(express.json());
app.use("/api/", registerRouter);


app.listen(3000, () => console.log("Server has begun"));