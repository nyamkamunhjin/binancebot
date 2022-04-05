import Discord from 'discord.js';
const client = new Discord.Client();
import dotenv from 'dotenv';
import cors from 'cors';
import Binance from 'binance-api-node';
import BinanceAPI from './binance/functions';

let currentSymbol: string = 'ETHBUSD';

dotenv.config();
import express from 'express';
const app = express();
app.use(cors());
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
  }: { side: string; symbol: string; entry: string; leverage: number } =
    req.body;
  try {
    if (!(entry.toLowerCase() === 'buy' || entry.toLowerCase() === 'sell')) {
      throw new Error(`entry is not sell or buy ${entry.toLowerCase()}`);
    }
    await BinanceAPI.entry(
      symbol,
      leverage || 1,
      side === 'buy' ? 'BUY' : 'SELL',
      0.005,
      0.01,
      [
        { where: 0.5, qty: 0.5 },
        { where: 1, qty: 0.5 },
      ]
    );

    currentSymbol = symbol;
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    BinanceAPI.sendNotifications(error.message);
    return res.json({ success: false });
  }
});

app.listen(8000, () => console.log('listening on port', 8000));
// const prisma = new PrismaClient();

const binanceClient = Binance({
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_SECRET_KEY,
  getTime: () => new Date().getTime(),
});

binanceClient.ws.futuresUser(async (msg) => {
  /* cancel all orders if there's no position */
  const positions = await BinanceAPI.currentPositions();
  if (positions.length === 0) {
    console.log('Cancelling all open orders');
    await binanceClient.futuresCancelAllOpenOrders({
      symbol: currentSymbol,
    });
  }
});
