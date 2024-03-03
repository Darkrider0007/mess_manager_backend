import Router from "express";
import { getCurrentUser, loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";


const router = Router();

router.route('/registration').post(upload.single('avatar'),registerUser)
router.route('/login').post(loginUser)

////////Secured Routes/////////

router.route('/logout').get(verifyJWT, logoutUser)
router.route('/getCurrentUser').get(verifyJWT, getCurrentUser)

export default router;