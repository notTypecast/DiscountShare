import express from "express";
import { requireAdmin } from "../middleware/requireAuth.js";
import { generateMatchSchema } from "../middleware/schema.js";
import { adminControllerPost, adminControllerDelete } from "../controllers/adminController.js";
import multer from "multer";

const router = express.Router();
const upload = multer({
    dest: "data/uploads/"
});

router.post("/admin", requireAdmin, upload.any(), generateMatchSchema("admin", "post"), adminControllerPost);
router.delete("/admin", requireAdmin, generateMatchSchema("admin", "delete"), adminControllerDelete);

export {router as adminRouter};