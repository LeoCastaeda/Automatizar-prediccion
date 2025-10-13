import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/errors.js";
import { createAlert, listAlerts, deactivateAlert } from "../services/alerts.service.js";
import { AlertType } from "@prisma/client";

const router = Router();

const createSchema = z.object({
  userId: z.number().int().positive(),
  symbol: z.string().min(1),
  currency: z.string().min(1),
  type: z.nativeEnum(AlertType),
  targetValue: z.number().optional(),
  percentage: z.number().optional()
}).refine(v => (v.type === "PRICE" && typeof v.targetValue === "number") || (v.type === "CHANGE_%" && typeof v.percentage === "number"), {
  message: "Para PRICE aporta targetValue; para CHANGE_% aporta percentage"
});

router.post("/", asyncHandler(async (req, res) => {
  const body = createSchema.parse(req.body);
  const alert = await createAlert(body);
  res.status(201).json({ alert });
}));

router.get("/", asyncHandler(async (req, res) => {
  const userId = req.query.userId ? Number(req.query.userId) : undefined;
  const alerts = await listAlerts(userId);
  res.json({ alerts });
}));

router.post("/:id/deactivate", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const alert = await deactivateAlert(id);
  res.json({ alert });
}));

export default router;
