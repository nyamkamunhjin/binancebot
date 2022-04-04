import dotenv, { parse } from 'dotenv';
import Binance, {
  FuturesUserTradeResult,
  NewFuturesOrder,
  NewOrderSpot,
  OrderSide_LT,
  OrderType,
} from 'binance-api-node';
import axios from 'axios';

dotenv.config();

const sendNotifications = (message: string) => {
  axios.post(
    'https://discord.com/api/webhooks/952119031924682792/QomYbFPWTOHoEpP9594jUHQfrnRr86YAFvXlfsFdqoRopgA-Dm2NbAe8Wy7PzQ80sUX9',
    {
      content: message,
    }
  );
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

const entry = async (
  symbol: string,
  setLeverage: number,
  side: OrderSide_LT,
  partialProfits: {
    where: number;
    qty: number;
  }[]
) => {
  sendNotifications(
    `Entry ${symbol} Leverage: ${setLeverage}, Side: ${side} PartialProfits: ${JSON.stringify(
      partialProfits
    )}`
  );
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

  const trade = await binanceClient.trades({ symbol: symbol, limit: 1 });

  const qty = convertToPrecision(
    (parseFloat(balance.balance) * leverage.leverage) /
      parseFloat(trade[0].price),
    quantityPrecision
  );

  console.log(qty);

  const entryOrder: NewFuturesOrder = {
    symbol: symbol,
    type: 'MARKET',
    side: side,
    quantity: `${qty}`,
  };

  // entry
  try {
    const executedEntryOrder = await binanceClient.futuresOrder(entryOrder);
    console.log('--------------------- ENTRY ----------------------');
    console.log({ entry: executedEntryOrder });
    console.log('--------------------- ----- ----------------------');
  } catch (error) {
    console.error(error);
    sendNotifications(error.message);
  }

  // stoploss
  const currentPosititon = await getPosition(symbol);

  let price =
    parseFloat(currentPosititon.entryPrice) +
    parseFloat(currentPosititon.entryPrice) * 0.005 * (side === 'BUY' ? -1 : 1);

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
  partialProfits.forEach(async (item) => {
    const price =
      parseFloat(currentPosititon.entryPrice) +
      parseFloat(currentPosititon.entryPrice) *
        0.04 *
        (side === 'BUY' ? 1 : -1) *
        item.where;

    const qty = convertToPrecision(currentQty * item.qty, quantityPrecision);

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

const currentPositions = async () => {
  const accountInfo = await binanceClient.futuresAccountInfo();

  const positions = accountInfo.positions.filter(
    (item) => parseFloat(item.entryPrice) > 0
  );
  return positions;
};

const getPosition = async (symbol: string) => {
  const positions = await currentPositions();

  return positions.find((item) => item.symbol === symbol) || undefined;
};

export default {
  checkConnection,
  currentPositions,
  entry,
  getPosition,
  sendNotifications,
};
