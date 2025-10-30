import { Router } from "express";

const router = Router();

// Test route đơn giản
router.get("/test", (req, res) => {
  res.json({ message: "Chat API is working!" });
});

// Test POST route
router.post("/test", (req, res) => {
  res.json({
    message: "Chat POST is working!",
    received: req.body,
  });
});

export default router;
