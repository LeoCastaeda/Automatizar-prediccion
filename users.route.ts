import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "./errors.js";
import { prisma } from "./prisma.js";

const router = Router();

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional()
});

router.post("/", asyncHandler(async (req, res) => {
  const body = createUserSchema.parse(req.body);
  const user = await prisma.user.create({
    data: body
  });
  res.status(201).json({ user });
}));

router.get("/", asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: { alerts: true }
      }
    }
  });
  res.json({ users });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      alerts: true
    }
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
}));

export default router;
