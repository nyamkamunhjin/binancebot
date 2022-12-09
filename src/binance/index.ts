import dotenv from 'dotenv';
import Binance from 'binance-api-node';
import moment from 'moment';

dotenv.config()

const binanceClient = Binance({
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_SECRET_KEY,
  getTime: () => moment().unix() * 1000,
});

export {
  binanceClient
}