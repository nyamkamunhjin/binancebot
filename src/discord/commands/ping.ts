import { SlashCommandBuilder } from 'discord.js';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pongyy!'),
  async execute(interaction) {
    console.log('Executing')
    await interaction.reply('Hello !');
  },
};