import axios from 'axios';
import Discord from 'discord.js';
import { heroData } from './dota/HeroData';
import { skills } from './dota/skills';

const getRecentMatch = async (playerId: string) => {
  const recentMatches = await axios
    .get(`https://api.opendota.com/api/players/${playerId}/recentMatches`)
    .then((res) => res.data);
  return recentMatches;
};

const getLastMatch = async (playerId: string) => {
  const recentMatches = await axios
    .get(`https://api.opendota.com/api/players/${playerId}/recentMatches`)
    .then((res) => res.data);
  return recentMatches[0];
};

const getDotaLastMatch = async (message: Discord.Message, args: any) => {
  const recentMatch = await getLastMatch(args);

  if (!recentMatch)
    message.channel.send(`${message.author.username} no match found ❌`);

  console.log({ recentMatch });
  const skillIndex: '1' | '2' | '3' = recentMatch.skill;

  console.log(typeof recentMatch.hero_id);
  // console.log(skills[skillIndex], { skill: recentMatch.skill });
  const hero = heroData.filter(({ id }) => id === recentMatch.hero_id)[0];

  const isRadiant = recentMatch.player_slot < 128;

  let winStatus: boolean = false;

  if (isRadiant && recentMatch.radiant_win) winStatus = true;
  if (!isRadiant && !recentMatch.radiant_win) winStatus = true;

  const newEmbed = new Discord.MessageEmbed()
    .setAuthor(
      message.guild.member(message.author).nickname ||
        message.guild.member(message.author).displayName,
      message.author.avatarURL()
    )
    .setImage(
      `https://steamcdn-a.akamaihd.net/apps/dota2/images/heroes/${hero.name.replace(
        'npc_dota_hero_',
        ''
      )}_sb.png`
    )
    .setTitle(`Last match 🎮`)
    .setColor(winStatus ? '#32CD32' : '#F87171')
    .addFields(
      {
        name: 'Result',
        value: winStatus ? '✅' : '❌',
        inline: true,
      },
      { name: 'Hero', inline: true, value: hero.localized_name },
      {
        name: 'K/D/A',

        inline: true,
        value: `${recentMatch.kills}/${recentMatch.deaths}/${recentMatch.assists}`,
      },
      {
        name: 'Skill',
        inline: true,
        value: skills[skillIndex] || 'UNKNOWN SKILL',
      },
      {
        name: 'Date',
        value: new Date(recentMatch.start_time * 1000).toLocaleString(),
        inline: true,
      },
      {
        name: 'Party',
        value: recentMatch.party_size,
      }
    );

  message.channel.send(newEmbed);
};

export { getDotaLastMatch };
