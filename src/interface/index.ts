export interface EntryType {
  side: string;
  price: string;
  symbol: string;
  entry: string;
  leverage: number;
  stopLoss: number;
  takeProfit: number;
  partialProfits: { where: number; qty: number }[];
}
