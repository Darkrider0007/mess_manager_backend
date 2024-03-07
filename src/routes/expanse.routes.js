import Route from "express";
import {
  addExpanse,
  deleteExpanse,
  getExpanse,
  updateExpanse,
} from "../controllers/expanse.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = new Route();

router.use(verifyJWT);

router.route("/add-expanse/:messID").patch(addExpanse);
router.route("/update-expanse/:expanseID").patch(updateExpanse);
router.route("/get-expanses/:messID").get(getExpanse);
router.route("/delete-expanse/:expanseID").delete(deleteExpanse);

export default router;
