import express from "express";
import { registerController } from "../controllers/registerController.js";
import { generateMatchSchema } from "../middleware/schema.js";
const router = express.Router();

router.post("/register", generateMatchSchema("register", "post"), registerController);

export {router as registerRouter};