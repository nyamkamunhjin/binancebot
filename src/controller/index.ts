import { NextFunction, Request, Response, Router } from 'express';
import BinanceAPI from '../binance/functions';
import Binance from 'binance-api-node';

/**
 * BindingType controller
 *
 * @author Munkhjin
 * @createdDate 01/04/2020
 */

const binanceClient = Binance({
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_SECRET_KEY,
  getTime: () => new Date().getTime(),
});

class Controller {
  public async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const trade = await binanceClient.futuresUserTrades({
        symbol: 'BTCBUSD',
        limit: 50,
      });

      return res.json(
        trade.map((each) => ({
          realizedPnL: each.realizedPnl,
          commission: each.commission,
          date: new Date(each.time),
        }))
      );
    } catch (error) {
      console.error(error);
      BinanceAPI.sendNotifications(error.message);
      return res.json({ success: false });
    }
  }
  public async getBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const balances = await binanceClient.futuresAccountBalance();
      const balance = balances.find((item) => item.asset === 'BUSD');

      return res.json(balance);
    } catch (error) {
      console.error(error);
      BinanceAPI.sendNotifications(error.message);
      return res.json({ success: false });
    }
  }
}

/**
 * BindingType routes
 *
 * @author Munkhjin
 * @createdDate 01/28/2020
 */
export const StatsContoller = () => {
  const controller = new Controller();
  const router = Router();
  router.get('/trades', controller.getStats);
  router.get('/balance', controller.getBalance);

  return router;
};
