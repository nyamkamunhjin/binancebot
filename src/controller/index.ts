import { NextFunction, Request, Response, Router } from 'express';
import BinanceAPI from '../binance/functions';
import Binance from 'binance-api-node';
import dotenv from 'dotenv';
import moment from 'moment';
import functions from '../binance/functions';
dotenv.config();

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

const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trades = await BinanceAPI.getTradeHistory(process.env.TRADE_PAIR, 1);
    if (trades.length === 0) return res.json({ success: false });

    return res.json(
      trades.map((each) => ({
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
};

const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(req.query?.pair as string);
    // const orders = await binanceClient.futuresUserTrades({
    //   symbol: (req.query?.pair as string) || 'BTCUSDT',
    //   // startTime: moment().subtract(1, 'month').unix(),
    //   // endTime: moment().unix(),
    // });

    const orders = await binanceClient.futuresOpenOrders({
      // symbol: (req.query?.pair as string) || 'BTCUSDT',
    });
    return res.json(orders);
  } catch (error) {
    console.error(error);
    BinanceAPI.sendNotifications(error.message);
    return res.json({ success: false });
  }
};

const getBalance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const balances = await binanceClient.futuresAccountBalance();
    const balance = balances.find(
      (item) => item.asset === process.env.CURRENCY
    );

    return res.json(balance);
  } catch (error) {
    console.error(error);
    BinanceAPI.sendNotifications(error.message);
    return res.json({ success: false });
  }
};

/**
 * BindingType routes
 *
 * @author Munkhjin
 * @createdDate 01/28/2020
 */
export const StatsContoller = () => {
  const router = Router();
  router.get('/trades', getStats);
  router.get('/balance', getBalance);
  router.get('/orders', getOrders);

  return router;
};
