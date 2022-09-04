import { Request, Response, Router } from 'express';
import BinanceAPI from '../binance/functions';
import dotenv from 'dotenv';
import { EntryType } from '../interface';
dotenv.config();

/**
 * BindingType controller
 *
 * @author Munkhjin
 * @createdDate 01/04/2020
 */

const entry = async (req: Request, res: Response) => {
  console.log('entry');
  try {
    const {
      side,
      symbol,
      price,
      leverage,
      entry,
      stopLoss,
      takeProfit,
      partialProfits,
    }: EntryType = req.body;
    if (entry.toLowerCase() === 'profit_25') {
      await BinanceAPI.setStoploss(
        symbol,
        'profit_25',
        takeProfit,
        stopLoss,
        side === 'buy' ? 'BUY' : 'SELL'
      );

      return res.json({ success: true });
    }

    if (entry.toLowerCase() === 'profit_50') {
      await BinanceAPI.setStoploss(
        symbol,
        'profit_50',
        takeProfit,
        stopLoss,
        side === 'buy' ? 'BUY' : 'SELL'
      );

      return res.json({ success: true });
    }

    if (entry.toLowerCase() === 'profit_75') {
      await BinanceAPI.setStoploss(
        symbol,
        'profit_75',
        takeProfit,
        stopLoss,
        side === 'buy' ? 'BUY' : 'SELL'
      );

      return res.json({ success: true });
    }

    /* market buy/sell entry on pair */
    if (!(entry.toLowerCase() === 'buy' || entry.toLowerCase() === 'sell')) {
      throw new Error(`entry is not sell or buy "${entry.toLowerCase()}"`);
    }
    // entry
    // await BinanceAPI.entry(
    //   symbol,
    //   leverage || 1,
    //   side === 'buy' ? 'BUY' : 'SELL',
    //   0.01,
    //   0.05,
    //   [
    //     { where: 0.5, qty: 0.5 },
    //     { where: 1, qty: 0.5 },
    //   ]
    // );

    await BinanceAPI.entry(
      symbol,
      leverage || 1,
      price,
      side === 'buy' ? 'BUY' : 'SELL',
      stopLoss,
      takeProfit,
      partialProfits
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    // BinanceAPI.sendNotifications(JSON.stringify(req.body));
    // BinanceAPI.sendNotifications(error.message);
    res.json({ success: false, error: error.message });
  }
};

/**
 * BindingType routes
 *
 * @author Munkhjin
 * @createdDate 01/28/2020
 */
export const TradeController = () => {
  const router = Router();
  router.post('/entry', entry);

  return router;
};
