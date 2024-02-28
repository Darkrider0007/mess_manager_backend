import { Router } from "express";
import { healthCheckControllerGet,healthCheckControllerPost } from "../controllers/healthCheck.controller.js";
import { upload } from "../middleware/multer.middleware.js"; 
const router = Router();

router
.get('/',healthCheckControllerGet)
.post('/',upload.single("http://localhost:8000/api/v1/health") ,healthCheckControllerPost);


export default router;
