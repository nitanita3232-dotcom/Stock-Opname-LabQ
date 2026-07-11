import { Router } from "express";
import { db } from "@workspace/db";
import { transactionsTable, analystsTable, itemsTable } from "@workspace/db";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import {
  ListTransactionsQueryParams,
  CreateTransactionBody,
  GetTransactionParams,
  UpdateTransactionParams,
  UpdateTransactionBody,
  DeleteTransactionParams,
} from "@workspace/api-zod";

const router = Router();

function serializeTx(
  tx: typeof transactionsTable.$inferSelect,
  item: typeof itemsTable.$inferSelect,
  analyst: typeof analystsTable.$inferSelect,
) {
  return {
    ...tx,
    createdAt: tx.createdAt.toISOString(),
    item: { ...item, createdAt: item.createdAt.toISOString() },
    analyst: { ...analyst, createdAt: analyst.createdAt.toISOString() },
  };
}

// GET /transactions
router.get("/transactions", async (req, res) => {
  const parsed = ListTransactionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }
  const { type, analystId, itemId, dateFrom, dateTo, limit } = parsed.data;

  const rows = await db
    .select()
    .from(transactionsTable)
    .leftJoin(itemsTable, eq(transactionsTable.itemId, itemsTable.id))
    .leftJoin(analystsTable, eq(transactionsTable.analystId, analystsTable.id))
    .where(
      and(
        type ? eq(transactionsTable.type, type) : undefined,
        analystId ? eq(transactionsTable.analystId, analystId) : undefined,
        itemId ? eq(transactionsTable.itemId, itemId) : undefined,
        dateFrom ? gte(transactionsTable.createdAt, new Date(dateFrom)) : undefined,
        dateTo ? lte(transactionsTable.createdAt, new Date(dateTo + "T23:59:59Z")) : undefined,
      ),
    )
    .orderBy(desc(transactionsTable.createdAt))
    .limit(limit ?? 50);

  res.json(
    rows
      .filter((r) => r.items && r.analysts)
      .map((r) => serializeTx(r.transactions, r.items!, r.analysts!)),
  );
});

// POST /transactions
router.post("/transactions", async (req, res) => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const [tx] = await db.insert(transactionsTable).values(parsed.data).returning();

  const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, tx.itemId));
  const [analyst] = await db.select().from(analystsTable).where(eq(analystsTable.id, tx.analystId));

  if (!item || !analyst) {
    res.status(404).json({ error: "Item or analyst not found" });
    return;
  }
  res.status(201).json(serializeTx(tx, item, analyst));
});

// GET /transactions/:id
router.get("/transactions/:id", async (req, res) => {
  const parsed = GetTransactionParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .select()
    .from(transactionsTable)
    .leftJoin(itemsTable, eq(transactionsTable.itemId, itemsTable.id))
    .leftJoin(analystsTable, eq(transactionsTable.analystId, analystsTable.id))
    .where(eq(transactionsTable.id, parsed.data.id));

  if (!row || !row.items || !row.analysts) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(serializeTx(row.transactions, row.items, row.analysts));
});

// PUT /transactions/:id
router.put("/transactions/:id", async (req, res) => {
  const paramParsed = UpdateTransactionParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = UpdateTransactionBody.safeParse(req.body);
  if (!paramParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (bodyParsed.data.qty !== undefined) updateData.qty = bodyParsed.data.qty;
  if (bodyParsed.data.notes !== undefined) updateData.notes = bodyParsed.data.notes;
  if (bodyParsed.data.analystId !== undefined) updateData.analystId = bodyParsed.data.analystId;

  const [tx] = await db
    .update(transactionsTable)
    .set(updateData)
    .where(eq(transactionsTable.id, paramParsed.data.id))
    .returning();

  if (!tx) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, tx.itemId));
  const [analyst] = await db.select().from(analystsTable).where(eq(analystsTable.id, tx.analystId));

  res.json(serializeTx(tx, item!, analyst!));
});

// DELETE /transactions/:id
router.delete("/transactions/:id", async (req, res) => {
  const parsed = DeleteTransactionParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(transactionsTable).where(eq(transactionsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
