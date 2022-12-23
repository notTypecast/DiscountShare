import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { shopsController } from "../controllers/shopsController.js";
import { generateMatchSchema } from "../middleware/schema.js";
const router = express.Router();

router.get("/shops", requireAuth, generateMatchSchema("shops", "get"), shopsController);

export {router as shopsRouter};