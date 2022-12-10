import BinanceAPI from '../../binance/functions';
import dotenv from 'dotenv';
import { CommandInteraction, Embed, EmbedBuilder } from 'discord.js'
dotenv.config();


import { CacheType, Interaction, SlashCommandBuilder } from 'discord.js';

module.exports = {
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