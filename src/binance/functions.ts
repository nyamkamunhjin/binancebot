import dotenv, { parse } from 'dotenv';
import Binance, {
  FuturesUserTradeResult,
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

const entry = async (
  symbol: string,
  setLeverage: number,
  side: OrderSide_LT,
  partialProfits: {
    where: number;
    qty: number;
  }[]
) => {
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

  const leverage = await binanceClient.futuresLeverage({
    symbol: symbol,
    leverage: setLeverage,
  });

  const trade = await binanceClient.trades({ symbol: symbol, limit: 1 });

  const qty = (
    (parseFloat(balance.balance) * leverage.leverage) /
    parseFloat(trade[0].price)
  ).toFixed(quantityPrecision);

  const entryOrder: NewFuturesOrder = {
    symbol: symbol,
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
  const currentPosititon = await getPosition(symbol);

  let price =
    parseFloat(currentPosititon.entryPrice) +
    parseFloat(currentPosititon.entryPrice) * 0.005 * (side === 'BUY' ? -1 : 1);

  const currentQty = Math.abs(parseFloat(currentPosititon.positionAmt));

  const stopLossOrder: NewFuturesOrder = {
    symbol: symbol,
    stopPrice: parseFloat(price.toFixed(pricePrecision)),
    closePosition: 'true',
    type: 'STOP_MARKET',
    side: side === 'BUY' ? 'SELL' : 'BUY',
    quantity: `${currentQty}`,
  };

  const executedStopLossOrder = await binanceClient.futuresOrder(stopLossOrder);
  console.log('--------------------- STOPLOSS ----------------------');
  console.log({ executedStopLossOrder });
  console.log('--------------------- -------- ----------------------');

  // takeprofit
  partialProfits.forEach(async (item) => {
    const price =
      parseFloat(currentPosititon.entryPrice) +
      parseFloat(currentPosititon.entryPrice) *
        0.04 *
        (side === 'BUY' ? 1 : -1) *
        item.where;

    const qty = (currentQty * item.qty).toFixed(quantityPrecision);

    console.log({ price, qty });

    const takeProfitOrder: NewFuturesOrder = {
      symbol: symbol,
      price: parseFloat(price.toFixed(pricePrecision)),
      type: 'LIMIT',
      side: side === 'BUY' ? 'SELL' : 'BUY',
      quantity: `${qty}`,
    };

    const executedTakeProfitOrder = await binanceClient.futuresOrder(
      takeProfitOrder
    );
    console.log('--------------------- TAKEPROFIT ----------------------');
    console.log({ executedTakeProfitOrder });
    console.log('--------------------- -------- ----------------------');
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
};
