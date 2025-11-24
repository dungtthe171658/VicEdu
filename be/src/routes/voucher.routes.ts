import { Router } from "express";
import {
  createVoucher,
  applyVoucherController,
  listVouchers,
} from "../controllers/voucher.controller";

const router = Router();

router.post("/", createVoucher);

router.post("/apply", applyVoucherController);

router.get("/", listVouchers);

export default router;
