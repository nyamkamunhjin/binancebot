import Discord, { TeamMember } from 'discord.js';
const client = new Discord.Client();
import dotenv, { parse } from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import Binance, {
  NewFuturesOrder,
  NewOrderSpot,
  OrderType,
} from 'binance-api-node';
import { PrismaClient } from '.prisma/client';
import binanceApiNode from 'binance-api-node';
import BinanceAPI from './binance/functions';
dotenv.config();

// const prisma = new PrismaClient();

const binanceClient = Binance({
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_SECRET_KEY,
  getTime: () => new Date().getTime(),
});

const main = async () => {
  // console.log(await binanceClient.ping());
  // BinanceAPI.entry('SELL');
  // const currentPosititon = (
  //   await binanceClient.futuresUserTrades({
  //     symbol: 'SOLBUSD',
  //   })
  // ).pop();
  // console.log({ currentPosititon });
};

main();

binanceClient.ws.futuresUser(async (msg) => {
  const currentPosititon = (
    await binanceClient.futuresUserTrades({
      symbol: 'SOLBUSD',
    })
  ).pop();
  console.log({
    currentPosititon,
    bool: parseFloat(currentPosititon.realizedPnl) !== 0,
  });

  if (parseFloat(currentPosititon.realizedPnl) !== 0) {
    await binanceClient.futuresCancelAllOpenOrders({
      symbol: 'SOLBUSD',
    });
  }
});
