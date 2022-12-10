import BinanceAPI from '../../binance/functions';
import dotenv from 'dotenv';
import { CommandInteraction, Embed, EmbedBuilder } from 'discord.js'
dotenv.config();

import { client } from '../bot'


import { CacheType, Interaction, SlashCommandBuilder } from 'discord.js';
import { FuturesBalanceResult, FuturesUserTradeResult } from 'binance-api-node';

const balance = {
	data: new SlashCommandBuilder()
		.setName('balance')
		.setDescription('Checks balance of the bot!'),
	async execute(interaction: CommandInteraction) {
		const balance = await BinanceAPI.getCurrentBalance(process.env.CURRENCY as string);

		const parsedBalance = Object.entries(balance as FuturesBalanceResult).flatMap(([key, value]) => {
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
		const newEmbed = new EmbedBuilder()
			.setTitle(process.env.TRADE_PAIR as string)
			.addFields(parsedBalance);

		await BinanceAPI.updateBalance(client)
		
		await interaction.reply({ embeds: [newEmbed] });
	},
};


const currentPosition = {
	data: new SlashCommandBuilder()
		.setName('current-position')
		.setDescription('Lists current position'),
	async execute(interaction: CommandInteraction) {
		       const orders = await BinanceAPI.getOpenOrders();

    const parsedOrders = orders.map((item) => {
      return {
        name: `${item.type} (${item.side})`,
        value: item.type === 'LIMIT' ? item.price : item.stopPrice,
      };
    });
    const newEmbed = new EmbedBuilder()
      .setTitle(process.env.TRADE_PAIR as string)
      .addFields(parsedOrders);
			await interaction.reply({ embeds: [newEmbed] });
	},

};

const tradeHistory = {
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

export default [balance, tradeHistory, currentPosition]