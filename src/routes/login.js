import express from "express";
import {loginController} from "../controllers/loginController.js";
import { generateMatchSchema } from "../middleware/schema.js";
const router = express.Router();

router.post("/login", generateMatchSchema("login", "post"), loginController);

export {router as loginRouter};