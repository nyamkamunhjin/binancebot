import Discord from 'discord.js';
const client = new Discord.Client();
import dotenv from 'dotenv';
import cors from 'cors';
import Binance from 'binance-api-node';
import BinanceAPI from './binance/functions';

let currentSymbol: string;

dotenv.config();
import express from 'express';
const app = express();
app.use(cors());
app.use(express.json());
app.options('*', cors());

app.get('/', (_req, res) => {
  res.send('Success');
});

app.post('/entry', async (req, res) => {
  console.log('entry');
  const {
    side,
    symbol,
    leverage,
  }: { side: string; symbol: string; leverage: number } = req.body;
  await BinanceAPI.entry(
    symbol,
    leverage || 1,
    side === 'buy' ? 'BUY' : 'SELL',
    [
      { where: 0.25, qty: 0.25 },
      { where: 0.5, qty: 0.25 },
      { where: 1, qty: 0.5 },
    ]
  );

  currentSymbol = symbol;
  return res.json({ success: true });
});

app.listen(8083, () => console.log('listening on port', 8083));
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
