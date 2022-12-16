import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { registerController } from "../controllers/registerController.js";
const router = express.Router();



router.post("/register", registerController);

export {router as registerRouter};