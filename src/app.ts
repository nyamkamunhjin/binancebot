import cors from 'cors';
import { binanceClient } from './binance';
import BinanceAPI from './binance/functions';

import { client, initializeSlashCommands } from './discord/bot';
import dotenv from 'dotenv';
dotenv.config();

initializeSlashCommands()

import express, { Router } from 'express';

import { StatsContoller } from './controller';
import { ActivityType } from 'discord.js';


/* Routes */
const router = Router();
router.use('/stats', StatsContoller());
/* ------ */

let currentSymbol: string = process.env.TRADE_PAIR;
interface BodyInterface {
  side: string;
  price: string;
  symbol: string;
  entry: string;
  risk: number;
  stopLoss: number;
  takeProfit: number;
  partialProfits: { where: number; qty: number }[];
}

const app = express();
app.use(cors());
app.use('/api/v1/', router);
app.use(express.json());
app.options('*', cors());

app.get('/', async (_req, res) => {
  res.json({
    name: process.env.BOT_NAME,
    binance_api: await binanceClient.futuresPing(),
    currency: process.env.CURRENCY,
    trade_pair: process.env.TRADE_PAIR,
  });
});

app.post('/entry', async (req, res) => {
  console.log('entry');
  const {
    side,
    symbol,
    price,
    risk,
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
        stopLoss,
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
        stopLoss,
        side === 'buy' ? 'BUY' : 'SELL'
      );
      currentSymbol = symbol;
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
      risk,
      price,
      side === 'buy' ? 'BUY' : 'SELL',
      stopLoss,
      takeProfit,
      partialProfits
    );

    currentSymbol = symbol;
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    BinanceAPI.sendNotifications(JSON.stringify(req.body));
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
    const balance = await BinanceAPI.getCurrentBalance(process.env.CURRENCY);
    client.user?.setPresence({
      activities: [{
        type: ActivityType.Watching,
        name: `$${parseFloat(balance.balance).toFixed(2)}`,
      }],
    });

  }
});

// setI nterval(() => BinanceAPI.updateBalance(client), 1000 * 60);
const main = async () => {
  /* test only */
  try {
  } catch (error) {
    console.error(error);
  }
};

// main();
