import { Router } from "express";
import {
  createVoucher,
  applyVoucherController,
  listVouchers,
  updateVoucher,
  deleteVoucher,
} from "../controllers/voucher.controller";
import { authenticateToken, checkRole } from "../middlewares/auth";

const router = Router();

router.post("/", authenticateToken, checkRole(["admin"]), createVoucher);

router.get("/", authenticateToken, checkRole(["admin"]), listVouchers);

router.patch("/:id", authenticateToken, checkRole(["admin"]), updateVoucher);
router.delete("/:id", authenticateToken, checkRole(["admin"]), deleteVoucher);

router.post("/apply", applyVoucherController);





export default router;
