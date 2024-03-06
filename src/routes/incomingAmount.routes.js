import  Router  from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { addIncomingAmount, updateIncomingAmount } from "../controllers/incomingAmount.controller.js";


const router = Router();

router.use(verifyJWT);

//////// Amount Routes ////////
router.patch("/add-amount/:messId", addIncomingAmount);

router.patch("/update-amount/:transactionId", updateIncomingAmount);

export default router;
