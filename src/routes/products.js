import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { productsController } from "../controllers/productsController.js";
import { generateMatchSchema } from "../middleware/schema.js";
const router = express.Router();

router.get("/products", requireAuth, generateMatchSchema("products", "get"), productsController);

export {router as productsRouter};