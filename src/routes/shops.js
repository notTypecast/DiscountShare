import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { shopsController } from "../controllers/shopsController.js";
import { generateMatchSchema } from "../middleware/schema.js";
const router = express.Router();

// TODO: add requireAuth middleware
router.post("/shops", generateMatchSchema("shops"), shopsController);

export {router as shopsRouter};