import {
  FuturesAccountPosition,
  FuturesUserTradeResult,
} from 'binance-api-node';
import { CacheType, Client, Collection, Events, GatewayIntentBits, Interaction, REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
import moment from 'moment';
// import BinanceAPI from '../binance/functions';
import fs from 'fs'

dotenv.config();

const commands: { data: SlashCommandBuilder, execute: (interaction:  Interaction<CacheType>) => void }[] = []
// Grab all the command files from the commands directory you created earlier
const commandFiles = fs.readdirSync('src/discord/commands').filter(file => file.endsWith('.ts') || file.endsWith('.js'));

// and deploy your commands!
export const initializeSlashCommands = async () => {

  try {


    // Construct and prepare an instance of the REST module
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    for (const file of commandFiles) {
      const command: { data: SlashCommandBuilder, execute: () => void } = require(`./commands/${file}`);
      commands.push(command);
    }
    console.log(`Started refreshing application (/) commands.`);

    // The put method is used to fully refresh all commands in the guild with the current set
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands.map((command) => command.data.toJSON()) },
    );

    console.log(`Successfully reloaded application (/) commands.`);
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
};

export const client = new Client({ intents: [GatewayIntentBits.Guilds] })

client.once(Events.ClientReady, client => {
  console.log(`Ready! Logged in as ${client.user.tag}`)
})

client.on(Events.InteractionCreate, interaction => {
  const command = commands.find(command => command.data.toJSON().name === (interaction as any).commandName);


  command.execute(interaction)
  if (!interaction.isChatInputCommand()) return;
  // console.log(interaction);
});




client.login(process.env.DISCORD_TOKEN)
