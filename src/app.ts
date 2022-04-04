import Discord from 'discord.js';
const client = new Discord.Client();
import dotenv from 'dotenv';
import Binance from 'binance-api-node';
import BinanceAPI from './binance/functions';
dotenv.config();

// const prisma = new PrismaClient();

const binanceClient = Binance({
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_SECRET_KEY,
  getTime: () => new Date().getTime(),
});

const main = async () => {
  // const accountInfo = await binanceClient.futuresAccountInfo();
  // console.log(
  //   accountInfo.positions.filter((item) => parseFloat(item.entryPrice) > 0)
  // );
  // await BinanceAPI.entry('ETHBUSD', 1, 'SELL', [
  //   { where: 0.25, qty: 0.25 },
  //   { where: 0.5, qty: 0.25 },
  //   { where: 1, qty: 0.5 },
  // ]);
};

main();

binanceClient.ws.futuresUser(async (msg) => {
  /* cancel all orders if there's no position */
  const positions = await BinanceAPI.currentPositions();
  if (positions.length === 0) {
    console.log('Cancelling all open orders');
    await binanceClient.futuresCancelAllOpenOrders({
      symbol: 'ETHBUSD',
    });
  }
});
