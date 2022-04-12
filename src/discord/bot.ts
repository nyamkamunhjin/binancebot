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
    const tradeHistory = await BinanceAPI.getTradeHistory('ETHBUSD', 50);
    const newEmbed = new Discord.MessageEmbed()
      .setTitle('ETHBUSD')
      .setDescription('Last 50 trade PnL')
      .addFields(
        tradeHistory.map((item) => ({
          name: `Profit and Loss (${item.date.toISOString().slice(0, 10)})`,
          value: `${parseFloat(item.realizedPnL).toPrecision(2)}$ ${
            parseFloat(item.realizedPnL) > 0 ? '✅' : '❌'
          }`,
          fee: item.commission,
          // inline: true,
        }))
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
