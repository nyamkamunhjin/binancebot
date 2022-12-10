import BinanceAPI from '../../binance/functions';
import dotenv from 'dotenv';
import { CommandInteraction, Embed, EmbedBuilder } from 'discord.js'
dotenv.config();


import { CacheType, Interaction, SlashCommandBuilder } from 'discord.js';
import { FuturesBalanceResult, FuturesUserTradeResult } from 'binance-api-node';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('trade-history')
		.setDescription('List of trade history'),
	async execute(interaction: CommandInteraction) {
		    const tradeHistory: FuturesUserTradeResult[] =
      await BinanceAPI.getTradeHistory(process.env.TRADE_PAIR as string, 100);

    // console.log(tradeHistory);
    const newEmbed = new EmbedBuilder()
      .setTitle(process.env.TRADE_PAIR as string)
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
            };
          })
      );
			await interaction.reply({ embeds: [newEmbed] });
	},

	
};