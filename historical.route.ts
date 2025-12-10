import { Router } from "express";
import { getHistoricalData } from "./coingecko.service.js";
import { asyncHandler } from "./errors.js";

const router = Router();

router.get("/:symbol", asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  const { currency = "eur", days = "7" } = req.query;
  
  const data = await getHistoricalData(
    symbol, 
    currency as string, 
    parseInt(days as string)
  );
  
  res.json({ data });
}));

export { router as historicalRouter };
