import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import mysql from "mysql";
import cors from "cors";

dotenv.config();
const app = express();
global.pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'DiscountShare'
});

import {registerRouter} from "./routes/register.js";
import { loginRouter } from "./routes/login.js";

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use("/api/", registerRouter);
app.use("/api/", loginRouter);


app.listen(3000, () => console.log("Server has begun"));