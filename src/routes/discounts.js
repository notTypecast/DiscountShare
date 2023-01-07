import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { generateMatchSchema } from "../middleware/schema.js";
import { editDiscount } from "../middleware/editDiscount.js";
import { discountsControllerGet, discountsControllerPost, discountsControllerPatch } from "../controllers/discountsController.js";
const router = express.Router();

router.get("/discounts", requireAuth, generateMatchSchema("discounts", "get"), discountsControllerGet);
router.post("/discounts", requireAuth, generateMatchSchema("discounts", "post"), editDiscount, discountsControllerPost);
router.patch("/discounts", requireAuth, generateMatchSchema("discounts", "patch"), editDiscount, discountsControllerPatch);

export {router as discountsRouter};