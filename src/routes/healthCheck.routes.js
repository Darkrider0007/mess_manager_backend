import { Router } from "express";
import { healthCheckControllerGet,healthCheckControllerPost,healthCheckControllerDelete } from "../controllers/healthCheck.controller.js";
import { upload } from "../middleware/multer.middleware.js"; 
const router = Router();

router
.get('/',healthCheckControllerGet)
.post('/',upload.single("health") ,healthCheckControllerPost)
.delete('/',healthCheckControllerDelete)


export default router;
