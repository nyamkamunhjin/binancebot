import { FuturesUserTradeResult } from 'binance-api-node';
import Discord from 'discord.js';
import dotenv from 'dotenv';
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
  if (message.content == `!balance`) {
    const balance = await BinanceAPI.getCurrentBalance(process.env.CURRENCY);
    message.channel.send(`$${parseFloat(balance.balance).toFixed(2)}`);
    BinanceAPI.updateBalance(client);
  }
});
