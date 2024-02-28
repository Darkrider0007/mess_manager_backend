import { Router } from "express";
import { healthCheckControllerGet,healthCheckControllerPost } from "../controllers/healthCheck.controller.js";


const router = Router();

router
.get('/',healthCheckControllerGet)
.post('/',healthCheckControllerPost);


export default router;