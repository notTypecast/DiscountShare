import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { categoriesController } from "../controllers/categoriesController.js";
import { generateMatchSchema } from "../middleware/schema.js";
const router = express.Router();

router.get("/categories", requireAuth, generateMatchSchema("categories", "get"), categoriesController);

export {router as categoriesRouter};