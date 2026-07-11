import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analystsRouter from "./analysts";
import itemsRouter from "./items";
import transactionsRouter from "./transactions";
import stockRouter from "./stock";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analystsRouter);
router.use(itemsRouter);
router.use(transactionsRouter);
router.use(stockRouter);
router.use(dashboardRouter);

export default router;
