import {
  FuturesAccountPosition,
  FuturesUserTradeResult,
} from 'binance-api-node';
import Discord from 'discord.js';
import dotenv from 'dotenv';
import moment from 'moment';
import BinanceAPI from '../binance/functions';
export const client = new Discord.Client();
dotenv.config();
client.login(process.env.DISCORD_TOKEN).then(async () => {
  console.log('**** app is running ****');
  console.log(
    `https://discord.com/oauth2/authorize?client_id=963402244764631080&scope=bot`
  );
  const balance = await BinanceAPI.getCurrentBalance(process.env.CURRENCY);
  client.user.setPresence({
    activity: {
      type: 'WATCHING',
      name: `$${parseFloat(balance.balance).toFixed(2)}`,
    },
  });
});

client.on('message', async (message) => {
  if (message.content == `!trade-history`) {
    const tradeHistory: FuturesUserTradeResult[] =
      await BinanceAPI.getTradeHistory(process.env.TRADE_PAIR, 100);

    if (tradeHistory.length === 0) return;
    // console.log(tradeHistory);
    const newEmbed = new Discord.MessageEmbed()
      .setTitle(process.env.TRADE_PAIR)
      .addFields(
        tradeHistory
          .slice(tradeHistory.length - 10, tradeHistory.length)
          .map((item) => {
            const [realizedPnl, fee] = [
              parseFloat(item.realizedPnl),
              parseFloat(item.commission),
            ];

            return {
              name: `Profit and Loss (${new Date(
                new Date(item.time)
              ).toLocaleString()})`,
              value: `${parseFloat(item.realizedPnl) > 0 ? '✅' : '❌'} ${(
                realizedPnl - fee
              ).toPrecision(2)}$`,
              // inline: true,
            };
          })
      );
    message.channel.send(newEmbed);
  }
});

client.on('message', async (message) => {
  if (message.content == `!current-position`) {
    const orders = await BinanceAPI.getOpenOrders();

    const parsedOrders = orders.map((item) => {
      return {
        name: `${item.type} (${item.side})`,
        value: item.type === 'LIMIT' ? item.price : item.stopPrice,
      };
    });
    const newEmbed = new Discord.MessageEmbed()
      .setTitle(process.env.TRADE_PAIR)
      .addFields(parsedOrders);
    message.channel.send(newEmbed);
  }
});

client.on('message', async (message) => {
  if (message.content == `!balance`) {
    const balance = await BinanceAPI.getCurrentBalance(process.env.CURRENCY);

    const parsedBalance = Object.entries(balance).flatMap(([key, value]) => {
      if (
        key === 'balance' ||
        key === 'crossUnPnl' ||
        key === 'availableBalance'
      ) {
        return {
          name: key.toLocaleUpperCase(),
          value: `$${parseFloat(value).toFixed(2)}`,
        };
      }
      return [];
    });
    const newEmbed = new Discord.MessageEmbed()
      .setTitle(process.env.TRADE_PAIR)
      .addFields(parsedBalance);
    message.channel.send(newEmbed);
    BinanceAPI.updateBalance(client);
  }
});

client.on('message', async (message) => {
  if (message.content == `!pnl`) {
    const incomeList = await BinanceAPI.getPnl();

    const fields = incomeList.map((item) => ({
      name: moment(item.time).format('YYYY/MM/DD HH:MM'),
      value: `${
        parseFloat(item.income) > 0
          ? `✅ $${parseFloat(item.income).toFixed(2)}`
          : `❌ $${parseFloat(item.income).toFixed(2)}`
      }`,
    }));

    const newEmbed = new Discord.MessageEmbed()
      .setTitle(`${process.env.BOT_NAME} (${process.env.TRADE_PAIR})`)
      .addFields(fields);
    message.channel.send(newEmbed);
    BinanceAPI.updateBalance(client);
  }
});
