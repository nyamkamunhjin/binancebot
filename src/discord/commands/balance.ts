import BinanceAPI from '../../binance/functions';
import dotenv from 'dotenv';
import { CommandInteraction, Embed, EmbedBuilder } from 'discord.js'
dotenv.config();

import { client } from '../bot'


import { CacheType, Interaction, SlashCommandBuilder } from 'discord.js';
import { FuturesBalanceResult } from 'binance-api-node';

module.exports = {
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