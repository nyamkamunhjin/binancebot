import { CommandInteraction, SlashCommandBuilder } from 'discord.js';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pongyy!'),
  async execute(interaction: CommandInteraction) {
    console.log('Executing')
    await interaction.reply('Hello !');
  },
};