import { Router } from "express";
import { db } from "@workspace/db";
import { transactionsTable, analystsTable, itemsTable } from "@workspace/db";
import { eq, sql, desc, gte, and } from "drizzle-orm";

const router = Router();

router.get("/dashboard/summary", async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [itemCount] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(itemsTable);
  const [analystCount] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(analystsTable);

  const [todayStats] = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      totalIn: sql<number>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'IN' THEN ${transactionsTable.qty} ELSE 0 END), 0)::int`,
      totalOut: sql<number>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'OUT' THEN ${transactionsTable.qty} ELSE 0 END), 0)::int`,
    })
    .from(transactionsTable)
    .where(gte(transactionsTable.createdAt, today));

  // low stock items
  const allItems = await db.select().from(itemsTable);
  let lowStockCount = 0;
  for (const item of allItems) {
    const [stats] = await db
      .select({
        totalIn: sql<number>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'IN' THEN ${transactionsTable.qty} ELSE 0 END), 0)::int`,
        totalOut: sql<number>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'OUT' THEN ${transactionsTable.qty} ELSE 0 END), 0)::int`,
      })
      .from(transactionsTable)
      .where(eq(transactionsTable.itemId, item.id));
    const current = Number(stats?.totalIn ?? 0) - Number(stats?.totalOut ?? 0);
    if (current <= item.minStock) lowStockCount++;
  }

  // recent transactions with joins
  const recentRows = await db
    .select()
    .from(transactionsTable)
    .leftJoin(itemsTable, eq(transactionsTable.itemId, itemsTable.id))
    .leftJoin(analystsTable, eq(transactionsTable.analystId, analystsTable.id))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(10);

  const recentTransactions = recentRows
    .filter((r) => r.items && r.analysts)
    .map((r) => ({
      ...r.transactions,
      createdAt: r.transactions.createdAt.toISOString(),
      item: { ...r.items!, createdAt: r.items!.createdAt.toISOString() },
      analyst: { ...r.analysts!, createdAt: r.analysts!.createdAt.toISOString() },
    }));

  res.json({
    totalItems: Number(itemCount?.count ?? 0),
    totalAnalysts: Number(analystCount?.count ?? 0),
    totalTransactionsToday: Number(todayStats?.total ?? 0),
    totalInToday: Number(todayStats?.totalIn ?? 0),
    totalOutToday: Number(todayStats?.totalOut ?? 0),
    lowStockCount,
    recentTransactions,
  });
});

export default router;
