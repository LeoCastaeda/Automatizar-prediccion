import { Router } from "express";
import { asyncHandler } from "../utils/errors.js";
import { getSimplePrice } from "../services/coingecko.service.js";

const router = Router();

router.get("/simple", asyncHandler(async (req, res) => {
  const symbols = String(req.query.symbols || "bitcoin").split(",").map(s => s.trim());
  const currency = String(req.query.currency || "eur");
  const data = await getSimplePrice(symbols, currency);
  res.json({ data });
}));

export default router;
