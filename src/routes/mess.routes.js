import Router from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import {
  addMemberToMess,
  createNewMess,
  getMessInfo,
  getMessMembersInfo,
  removeMemberFromMess,
  updateMessAdmin,
  updateMessInfo,
  updateMessLogo,
} from "../controllers/mess.controller.js";

const router = Router();

router.use(verifyJWT);

router.post("/create-new-mess", upload.single("messLogo"), createNewMess);
router.get("/get-mess-info/:messId", getMessInfo);
router.post("/add-member-to-mess", addMemberToMess);
router.delete("/remove-member-from-mess", removeMemberFromMess);
router.get("/get-mess-members-info/:messId", getMessMembersInfo);
router.patch("/update-mess-info/:messId", updateMessInfo);
router.patch("/update-mess-logo/:messId", upload.single("messLogo"), updateMessLogo);
router.patch("/update-mess-admin/:messId", updateMessAdmin);

export default router;
