import { Router } from "express";
import { db } from "@workspace/db";
import { analystsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateAnalystBody,
  UpdateAnalystParams,
  UpdateAnalystBody,
  DeleteAnalystParams,
  GetAnalystParams,
} from "@workspace/api-zod";

const router = Router();

// GET /analysts
router.get("/analysts", async (req, res) => {
  const analysts = await db
    .select()
    .from(analystsTable)
    .orderBy(analystsTable.createdAt);
  res.json(analysts.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })));
});

// POST /analysts
router.post("/analysts", async (req, res) => {
  const parsed = CreateAnalystBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const [analyst] = await db
    .insert(analystsTable)
    .values(parsed.data)
    .returning();
  res.status(201).json({ ...analyst, createdAt: analyst.createdAt.toISOString() });
});

// GET /analysts/:id
router.get("/analysts/:id", async (req, res) => {
  const parsed = GetAnalystParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [analyst] = await db
    .select()
    .from(analystsTable)
    .where(eq(analystsTable.id, parsed.data.id));
  if (!analyst) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...analyst, createdAt: analyst.createdAt.toISOString() });
});

// PUT /analysts/:id
router.put("/analysts/:id", async (req, res) => {
  const paramParsed = UpdateAnalystParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = UpdateAnalystBody.safeParse(req.body);
  if (!paramParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const [analyst] = await db
    .update(analystsTable)
    .set(bodyParsed.data)
    .where(eq(analystsTable.id, paramParsed.data.id))
    .returning();
  if (!analyst) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...analyst, createdAt: analyst.createdAt.toISOString() });
});

// DELETE /analysts/:id
router.delete("/analysts/:id", async (req, res) => {
  const parsed = DeleteAnalystParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(analystsTable).where(eq(analystsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
