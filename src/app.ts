import Discord from 'discord.js';
import dotenv from 'dotenv';
import cors from 'cors';
import Binance from 'binance-api-node';
import BinanceAPI from './binance/functions';
import { client } from './discord/bot';

import express, { Router } from 'express';

import { StatsContoller } from './controller';

const binanceClient = Binance({
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_SECRET_KEY,
  getTime: () => new Date().getTime(),
});

/* Routes */
const router = Router();
router.use('/stats', StatsContoller());
/* ------ */

let currentSymbol: string = 'BNBBUSD';
interface BodyInterface {
  side: string;
  symbol: string;
  entry: string;
  leverage: number;
  stopLoss: number;
  takeProfit: number;
  partialProfits: { where: number; qty: number }[];
}

dotenv.config();
const app = express();
app.use(cors());
app.use('/api/v1/', router);
app.use(express.json());
app.options('*', cors());

app.get('/', async (_req, res) => {
  res.json({ api: true, binance_api: await binanceClient.futuresPing() });
});

app.post('/entry', async (req, res) => {
  console.log('entry');
  const {
    side,
    symbol,
    leverage,
    entry,
    stopLoss,
    takeProfit,
    partialProfits,
  }: BodyInterface = req.body;
  try {
    if (entry.toLowerCase() === 'profit_25') {
      await BinanceAPI.setStoploss(
        symbol,
        'profit_25',
        takeProfit,
        side === 'buy' ? 'BUY' : 'SELL'
      );
      currentSymbol = symbol;
      return res.json({ success: true });
    }

    if (entry.toLowerCase() === 'profit_50') {
      await BinanceAPI.setStoploss(
        symbol,
        'profit_50',
        takeProfit,
        side === 'buy' ? 'BUY' : 'SELL'
      );
      currentSymbol = symbol;
      return res.json({ success: true });
    }

    /* if half profit target is hit move stoploss to entry price */
    if (entry.toLowerCase() === 'profit_50') {
      await BinanceAPI.setStoploss(
        symbol,
        'profit_50',
        takeProfit,
        side === 'buy' ? 'BUY' : 'SELL'
      );
      currentSymbol = symbol;
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
      side === 'buy' ? 'BUY' : 'SELL',
      stopLoss,
      takeProfit,
      partialProfits
    );

    currentSymbol = symbol;
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    BinanceAPI.sendNotifications(error.message);
    return res.json({ success: false });
  }
});

app.listen(process.env.PORT, () =>
  console.log('listening on port', process.env.PORT)
);

binanceClient.ws.futuresUser(async (msg) => {
  /* cancel all orders if there's no position */
  const positions = await BinanceAPI.currentPositions();
  if (positions.length === 0) {
    console.log('Cancelling all open orders');
    await binanceClient.futuresCancelAllOpenOrders({
      symbol: currentSymbol,
    });

    // update discord bot status
    const balance = await BinanceAPI.getCurrentBalance('BUSD');
    client.user.setPresence({
      activity: {
        type: 'WATCHING',
        name: `$${parseFloat(balance.balance).toFixed(2)}`,
      },
    });
  }
});

setInterval(() => BinanceAPI.updateBalance(client), 1000 * 60);
