import dotenv, { parse } from 'dotenv';
import Binance, {
  NewFuturesOrder,
  NewOrderSpot,
  OrderSide_LT,
  OrderType,
} from 'binance-api-node';

dotenv.config();

// const prisma = new PrismaClient();

const binanceClient = Binance({
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_SECRET_KEY,
  getTime: () => new Date().getTime(),
});

const checkConnection = () => {
  return binanceClient.ping();
};

const entry = async (side: OrderSide_LT) => {
  const balances = await binanceClient.futuresAccountBalance();

  const balance = balances.find((item) => item.asset === 'BUSD');

  console.log({ balance });

  const leverage = await binanceClient.futuresLeverage({
    symbol: 'SOLBUSD',
    leverage: 4,
  });

  const trade = await binanceClient.trades({ symbol: 'SOLBUSD', limit: 1 });

  const qty = Math.floor(
    (parseFloat(balance.balance) * leverage.leverage) /
      parseFloat(trade[0].price)
  );

  const entryOrder: NewFuturesOrder = {
    symbol: 'SOLBUSD',
    type: 'MARKET',
    side: side,
    quantity: `${qty}`,
  };

  // entry
  const executedEntryOrder = await binanceClient.futuresOrder(entryOrder);
  console.log('--------------------- ENTRY ----------------------');
  console.log({ entry: executedEntryOrder });
  console.log('--------------------- ----- ----------------------');

  // stoploss
  const currentPosititon = (
    await binanceClient.futuresUserTrades({
      symbol: 'SOLBUSD',
    })
  ).pop();

  let price =
    parseFloat(currentPosititon.price) +
    parseFloat(currentPosititon.price) * 0.005 * (side === 'BUY' ? -1 : 1);

  const stopLossOrder: NewFuturesOrder = {
    symbol: 'SOLBUSD',
    stopPrice: parseFloat(price.toFixed(2)),
    closePosition: 'true',
    type: 'STOP_MARKET',
    side: side === 'BUY' ? 'SELL' : 'BUY',
    quantity: `${currentPosititon.qty}`,
  };

  const executedStopLossOrder = await binanceClient.futuresOrder(stopLossOrder);
  console.log('--------------------- STOPLOSS ----------------------');
  console.log({ executedStopLossOrder });
  console.log('--------------------- -------- ----------------------');

  // takeprofit
  price =
    parseFloat(currentPosititon.price) +
    parseFloat(currentPosititon.price) * 0.04 * (side === 'BUY' ? 1 : -1);

  const takeProfitOrder: NewFuturesOrder = {
    symbol: 'SOLBUSD',
    price: parseFloat(price.toFixed(2)),
    type: 'LIMIT',
    side: side === 'BUY' ? 'SELL' : 'BUY',
    quantity: `${currentPosititon.qty}`,
  };

  const executedTakeProfitOrder = await binanceClient.futuresOrder(
    takeProfitOrder
  );
  console.log('--------------------- TAKEPROFIT ----------------------');
  console.log({ executedTakeProfitOrder });
  console.log('--------------------- -------- ----------------------');
};

export default {
  checkConnection,
  entry,
};
