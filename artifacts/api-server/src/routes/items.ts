import { Router } from "express";
import { db } from "@workspace/db";
import { itemsTable } from "@workspace/db";
import { eq, ilike, and } from "drizzle-orm";
import {
  ListItemsQueryParams,
  CreateItemBody,
  GetItemParams,
  UpdateItemParams,
  UpdateItemBody,
  DeleteItemParams,
  GetItemByBarcodeParams,
} from "@workspace/api-zod";

const router = Router();

function serializeItem(item: typeof itemsTable.$inferSelect) {
  return { ...item, createdAt: item.createdAt.toISOString() };
}

// GET /items
router.get("/items", async (req, res) => {
  const parsed = ListItemsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }
  const { category, search } = parsed.data;
  const conditions = [];
  if (category) conditions.push(eq(itemsTable.category, category));
  if (search) conditions.push(ilike(itemsTable.name, `%${search}%`));

  const items = conditions.length
    ? await db.select().from(itemsTable).where(and(...conditions)).orderBy(itemsTable.name)
    : await db.select().from(itemsTable).orderBy(itemsTable.name);

  res.json(items.map(serializeItem));
});

// POST /items
router.post("/items", async (req, res) => {
  const parsed = CreateItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const [item] = await db.insert(itemsTable).values(parsed.data).returning();
  res.status(201).json(serializeItem(item));
});

// GET /items/barcode/:barcode  — must come before /:id to avoid clash
router.get("/items/barcode/:barcode", async (req, res) => {
  const parsed = GetItemByBarcodeParams.safeParse({ barcode: req.params.barcode });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid barcode" });
    return;
  }
  const [item] = await db
    .select()
    .from(itemsTable)
    .where(eq(itemsTable.barcode, parsed.data.barcode));
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.json(serializeItem(item));
});

// GET /items/:id
router.get("/items/:id", async (req, res) => {
  const parsed = GetItemParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, parsed.data.id));
  if (!item) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serializeItem(item));
});

// PUT /items/:id
router.put("/items/:id", async (req, res) => {
  const paramParsed = UpdateItemParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = UpdateItemBody.safeParse(req.body);
  if (!paramParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const [item] = await db
    .update(itemsTable)
    .set(bodyParsed.data)
    .where(eq(itemsTable.id, paramParsed.data.id))
    .returning();
  if (!item) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serializeItem(item));
});

// DELETE /items/:id
router.delete("/items/:id", async (req, res) => {
  const parsed = DeleteItemParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(itemsTable).where(eq(itemsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
