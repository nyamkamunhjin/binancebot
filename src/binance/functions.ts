import Discord from 'discord.js';
import dotenv, { parse } from 'dotenv';
import Binance, {
  FuturesUserTradeResult,
  NewFuturesOrder,
  NewOrderSpot,
  OrderSide_LT,
  OrderType,
} from 'binance-api-node';
import axios from 'axios';
import moment from 'moment';

dotenv.config();

const sendNotifications = (message: string) => {
  axios.post(process.env.DISCORD_WEBHOOK, {
    content: message,
  });
};

// const prisma = new PrismaClient();
const countDecimals = (num: number) => {
  if (Math.floor(num) === num) return 0;
  return num.toString().split('.')[1].length || 0;
};

const convertToPrecision = (num: number, precision: number) => {
  return Math.trunc(num * Math.pow(10, precision)) / Math.pow(10, precision);
};

const binanceClient = Binance({
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_SECRET_KEY,
  getTime: () => new Date().getTime(),
});

const checkConnection = () => {
  return binanceClient.ping();
};

const currentPositions = async () => {
  const accountInfo = await binanceClient.futuresAccountInfo();

  const positions = accountInfo.positions.filter(
    (item) => parseFloat(item.entryPrice) > 0
  );
  return positions;
};

const entry = async (
  symbol: string,
  setLeverage: number,
  side: OrderSide_LT,
  stoploss: number,
  takeProfit: number,
  partialProfits: {
    where: number;
    qty: number;
  }[]
) => {
  /* no entry on current position */
  const positions = await currentPositions();
  if (positions.length > 0) {
    console.log('Cancelled opening position');
    throw new Error('Currently in a trade.');
  }

  const balances = await binanceClient.futuresAccountBalance();
  const balance = balances.find((item) => item.asset === 'BUSD');

  /* get precisions */
  const info = await binanceClient.futuresExchangeInfo();
  const symbolInfo = info.symbols.find((item) => item.symbol === symbol);
  const { pricePrecision, quantityPrecision } =
    symbolInfo as unknown as Symbol & {
      pricePrecision: number;
      quantityPrecision: number;
    };

  console.log({ symbolInfo });

  const priceFilter = symbolInfo.filters.find(
    (item) => item.filterType === 'PRICE_FILTER'
  );
  const tickSize = countDecimals(
    parseFloat((priceFilter as any).tickSize as string)
  );
  console.log(symbolInfo.filters);
  console.log({ tickSize });
  const leverage = await binanceClient.futuresLeverage({
    symbol: symbol,
    leverage: setLeverage,
  });

  const trade = await binanceClient.futuresTrades({ symbol: symbol, limit: 1 });

  /* added 0.99 multiplication due to margin being insufficient */
  const qty = convertToPrecision(
    (parseFloat(balance.balance) * 0.95 * leverage.leverage) /
      parseFloat(trade[0].price),
    quantityPrecision
  );

  console.log({
    qty,
    balance: balance.balance,
    leverage: leverage.leverage,
    price: trade[0].price,
    quantityPrecision,
  });

  const entryOrder: NewFuturesOrder = {
    symbol: symbol,
    type: 'MARKET',
    side: side,
    quantity: `${qty}`,
  };

  // entry
  let origQty: number = 0;
  try {
    const executedEntryOrder = await binanceClient.futuresOrder(entryOrder);
    console.log('--------------------- ENTRY ----------------------');
    console.log({ entry: executedEntryOrder });
    console.log('--------------------- ----- ----------------------');
    origQty = parseFloat(executedEntryOrder.origQty);
    sendNotifications(
      `Entry ${symbol} Leverage: ${setLeverage}, Side: ${side} PartialProfits: ${JSON.stringify(
        partialProfits
      )}`
    );
  } catch (error) {
    console.error(error);
    sendNotifications(error.message);
  }

  // stoploss
  const currentPosititon = await getPosition(symbol);

  let price =
    parseFloat(currentPosititon.entryPrice) +
    parseFloat(currentPosititon.entryPrice) *
      stoploss *
      (side === 'BUY' ? -1 : 1);

  const currentQty = Math.abs(parseFloat(currentPosititon.positionAmt));

  const stopLossOrder: NewFuturesOrder = {
    symbol: symbol,
    stopPrice: convertToPrecision(price, tickSize),
    closePosition: 'true',
    type: 'STOP_MARKET',
    side: side === 'BUY' ? 'SELL' : 'BUY',
    quantity: `${currentQty}`,
  };
  try {
    const executedStopLossOrder = await binanceClient.futuresOrder(
      stopLossOrder
    );
    console.log('--------------------- STOPLOSS ----------------------');
    console.log({ executedStopLossOrder });
    console.log('--------------------- -------- ----------------------');
  } catch (error) {
    console.error(error);
    sendNotifications(error.message);
  }

  // takeprofit
  const previousQtys: number[] = [];
  partialProfits.forEach(async (item) => {
    const price =
      parseFloat(currentPosititon.entryPrice) +
      parseFloat(currentPosititon.entryPrice) *
        takeProfit *
        (side === 'BUY' ? 1 : -1) *
        item.where;

    let qty = convertToPrecision(currentQty * item.qty, quantityPrecision);

    if (item.where === 1) {
      /* to remove any left size in open orders */
      qty = convertToPrecision(
        origQty - previousQtys.reduce((acc, cur) => acc + cur, 0),
        quantityPrecision
      );
    } else {
      previousQtys.push(qty);
    }

    console.log({
      price,
      qty,
      converted: convertToPrecision(price, pricePrecision),
    });

    const takeProfitOrder: NewFuturesOrder = {
      symbol: symbol,
      price: convertToPrecision(price, tickSize),
      type: 'LIMIT',
      side: side === 'BUY' ? 'SELL' : 'BUY',
      quantity: `${qty}`,
    };

    try {
      const executedTakeProfitOrder = await binanceClient.futuresOrder(
        takeProfitOrder
      );

      console.log('--------------------- TAKEPROFIT ----------------------');
      console.log({ executedTakeProfitOrder });
      console.log('--------------------- -------- ----------------------');
    } catch (error) {
      console.error(error);
    }
  });
};

const setStoploss = async (
  symbol: string,
  type: 'profit_25' | 'profit_50',
  takeProfit: number,
  side: OrderSide_LT
) => {
  /* get precisions */
  const info = await binanceClient.futuresExchangeInfo();
  const symbolInfo = info.symbols.find((item) => item.symbol === symbol);
  const priceFilter = symbolInfo.filters.find(
    (item) => item.filterType === 'PRICE_FILTER'
  );
  const tickSize = countDecimals(
    parseFloat((priceFilter as any).tickSize as string)
  );

  const currentPosititon = await getPosition(symbol);
  const currentQty = Math.abs(parseFloat(currentPosititon.positionAmt));

  let price;
  if (type === 'profit_25') {
    price = parseFloat(currentPosititon.entryPrice);
  }

  if (type === 'profit_50') {
    price =
      parseFloat(currentPosititon.entryPrice) +
      parseFloat(currentPosititon.entryPrice) *
        takeProfit *
        (side === 'SELL' ? 1 : -1) *
        0.25;
  }

  const stopLossOrder: NewFuturesOrder = {
    symbol: symbol,
    stopPrice: convertToPrecision(price, tickSize),
    closePosition: 'true',
    type: 'STOP_MARKET',
    side: side,
    quantity: `${currentQty}`,
  };

  try {
    const executedStopLossOrder = await binanceClient.futuresOrder(
      stopLossOrder
    );
    console.log('--------------------- STOPLOSS ----------------------');
    console.log({ executedStopLossOrder });
    console.log('--------------------- -------- ----------------------');
    sendNotifications(`Moving stoploss to entry ${symbol} Side: ${side}`);
  } catch (error) {
    console.error(error);
    sendNotifications(error.message);
  }
};

const getPosition = async (symbol: string) => {
  const positions = await currentPositions();

  return positions.find((item) => item.symbol === symbol) || undefined;
};

const getCurrentBalance = async (symbol: string) => {
  const balances = await binanceClient.futuresAccountBalance();
  const balance = balances.find((item) => item.asset === 'BUSD');
  return balance;
};

const getTradeHistory = async (symbol: string, limit: number) => {
  const trade = await binanceClient.futuresUserTrades({
    symbol,
    limit,
  });

  console.log(trade);

  return trade.flatMap((each) => {
    if (parseFloat(each.realizedPnl) === 0) return [];

    return each;
  });
};

const updateBalance = async (client: Discord.Client) => {
  // update discord bot status
  const balance = await getCurrentBalance('BUSD');
  client.user.setPresence({
    activity: {
      type: 'WATCHING',
      name: `$${parseFloat(balance.balance).toFixed(2)}`,
    },
  });
};

export default {
  checkConnection,
  currentPositions,
  entry,
  getPosition,
  sendNotifications,
  setStoploss,
  getCurrentBalance,
  getTradeHistory,
  updateBalance,
};
