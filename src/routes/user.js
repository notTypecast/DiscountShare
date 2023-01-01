import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { generateMatchSchema } from "../middleware/schema.js";
import { userControllerGet, userControllerPatch } from "../controllers/userController.js";
const router = express.Router();

router.get("/user", requireAuth, generateMatchSchema("user", "get"), userControllerGet);
router.patch("/user", requireAuth, generateMatchSchema("user", "patch"), userControllerPatch);

export {router as userRouter};