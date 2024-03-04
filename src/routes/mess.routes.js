import Router from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/multer.middleware.js';
import { createNewMess } from '../controllers/mess.controller.js';


const router = Router();

router.use(verifyJWT)

router.post('/create-new-mess',upload.single('messLogo'), createNewMess);

export default router;