import cors from 'cors';
import Binance from 'binance-api-node';
import BinanceAPI from './binance/functions';
import dotenv from 'dotenv';
import express from 'express';
import router from './router';

dotenv.config();
let currentSymbol: string = process.env.TRADE_PAIR;

const binanceClient = Binance({
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_SECRET_KEY,
  getTime: () => new Date().getTime(),
  httpFutures: 'https://testnet.binancefuture.com',
  wsFutures: 'wss://stream.binancefuture.com',
});

/* Routes */
/* ------ */

const app = express();
app.use(express.json());
app.use(cors());
app.options('*', cors());
app.use('/api', router);

app.get('/', async (_req, res) => {
  res.json({
    name: process.env.BOT_NAME,
    binance_api: await binanceClient.futuresPing(),
    currency: process.env.CURRENCY,
    trade_pair: process.env.TRADE_PAIR,
  });
});

app.listen(process.env.PORT, () =>
  console.log('listening on port', process.env.PORT)
);

// binanceClient.ws.futuresUser(async (msg) => {
//   /* cancel all orders if there's no position */
//   const positions = await BinanceAPI.currentPositions();
//   if (positions.length === 0) {
//     console.log('Cancelling all open orders');
//     await binanceClient.futuresCancelAllOpenOrders({
//       symbol: currentSymbol,
//     });

//     // update discord bot status
//     const balance = await BinanceAPI.getCurrentBalance(process.env.CURRENCY);
//   }
// });

const main = async () => {
  /* test only */
  let currentPosition: any;
  try {
    let count = 0;
    while (currentPosition === undefined) {
      count++;
      console.log('trying', count);
      currentPosition = await BinanceAPI.getPosition(process.env.TRADE_PAIR);
      if (count === 10) {
        currentPosition = 1;
      }
    }
  } catch (error) {
    console.error(error);
  }
};

// main();
