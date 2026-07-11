import { Router } from "express";
import { db } from "@workspace/db";
import { transactionsTable, itemsTable } from "@workspace/db";
import { eq, sql, desc, ilike, and } from "drizzle-orm";
import { ListStockQueryParams, GetItemStockParams } from "@workspace/api-zod";

const router = Router();

async function buildStockSummary(item: typeof itemsTable.$inferSelect) {
  const [stats] = await db
    .select({
      totalIn: sql<number>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'IN' THEN ${transactionsTable.qty} ELSE 0 END), 0)::int`,
      totalOut: sql<number>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'OUT' THEN ${transactionsTable.qty} ELSE 0 END), 0)::int`,
      lastTransactionAt: sql<string | null>`MAX(${transactionsTable.createdAt})`,
    })
    .from(transactionsTable)
    .where(eq(transactionsTable.itemId, item.id));

  const totalIn = Number(stats?.totalIn ?? 0);
  const totalOut = Number(stats?.totalOut ?? 0);
  const currentStock = totalIn - totalOut;

  return {
    item: { ...item, createdAt: item.createdAt.toISOString() },
    totalIn,
    totalOut,
    currentStock,
    isLowStock: currentStock <= item.minStock,
    lastTransactionAt: stats?.lastTransactionAt
      ? new Date(stats.lastTransactionAt).toISOString()
      : null,
  };
}

// GET /stock
router.get("/stock", async (req, res) => {
  const parsed = ListStockQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }
  const { search, category } = parsed.data;
  const lowStock = req.query.lowStock === "true";

  const conditions = [];
  if (search) conditions.push(ilike(itemsTable.name, `%${search}%`));
  if (category) conditions.push(eq(itemsTable.category, category));

  const items = conditions.length
    ? await db.select().from(itemsTable).where(and(...conditions)).orderBy(itemsTable.name)
    : await db.select().from(itemsTable).orderBy(itemsTable.name);

  const summaries = await Promise.all(items.map(buildStockSummary));

  const result = lowStock ? summaries.filter((s) => s.isLowStock) : summaries;
  res.json(result);
});

// GET /stock/:itemId
router.get("/stock/:itemId", async (req, res) => {
  const parsed = GetItemStockParams.safeParse({ itemId: Number(req.params.itemId) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid itemId" });
    return;
  }
  const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, parsed.data.itemId));
  if (!item) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const summary = await buildStockSummary(item);
  res.json(summary);
});

export default router;
