import { Router } from 'express';

import { StatsContoller } from '../controller/stats';
import { TradeController } from '../controller/trade';

/* Routes */
const router = Router();
router.use('/stats', StatsContoller());
router.use('/trade', TradeController());
/* ------ */

export default router;
