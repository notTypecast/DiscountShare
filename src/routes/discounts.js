import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { discountsControllerGet, discountsControllerPatch } from "../controllers/discountsController.js";
import { generateMatchSchema } from "../middleware/schema.js";
const router = express.Router();

router.get("/discounts", requireAuth, generateMatchSchema("discounts", "get"), discountsControllerGet);
router.patch("/discounts", requireAuth, generateMatchSchema("discounts", "patch"), discountsControllerPatch);

export {router as discountsRouter};