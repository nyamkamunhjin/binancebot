import { FuturesUserTradeResult } from 'binance-api-node';
import Discord from 'discord.js';
import dotenv from 'dotenv';
import { prependListener } from 'process';
import BinanceAPI from '../binance/functions';
export const client = new Discord.Client();
dotenv.config();
client.login(process.env.DISCORD_TOKEN).then(async () => {
  console.log('**** app is running ****');
  console.log(
    `https://discord.com/oauth2/authorize?client_id=963402244764631080&scope=bot`
  );
  const balance = await BinanceAPI.getCurrentBalance('BUSD');
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
      await BinanceAPI.getTradeHistory('SOLBUSD', 50);

    const newEmbed = new Discord.MessageEmbed().setTitle('SOLBUSD').addFields(
      tradeHistory.map((item) => {
        const [realizedPnl, fee] = [
          parseFloat(item.realizedPnl),
          parseFloat(item.commission),
        ];

        return {
          name: `Profit and Loss (${new Date(item.time).toLocaleString()})`,
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
    const balance = await BinanceAPI.getCurrentBalance('BUSD');
    message.channel.send(`$${parseFloat(balance.balance).toFixed(2)}`);
    client.user.setPresence({
      activity: {
        type: 'WATCHING',
        name: `$${parseFloat(balance.balance).toFixed(2)}`,
      },
    });
  }
});
