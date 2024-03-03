import Router from "express";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  newRefreshToken,
  registerUser,
  updatePassword,
  updateUserAvatar,
  updateUserDetails,
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/registration").post(upload.single("avatar"), registerUser);
router.route("/login").post(loginUser);

////////Secured Routes/////////

router.route("/logout").get(verifyJWT, logoutUser);
router.route("/getCurrentUser").get(verifyJWT, getCurrentUser);
router.route("/updatePassword").patch(verifyJWT, updatePassword);
router.route("/updateUserDetails").patch(verifyJWT, updateUserDetails);
router
  .route("/updateUserAvatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

router.route("/newRefreshToken").get(newRefreshToken);

export default router;
