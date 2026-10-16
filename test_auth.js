const { REST, Routes } = require('C:/Users/Administrator/.gemini/antigravity-ide/scratch/discord-bot/node_modules/discord.js');
require('C:/Users/Administrator/.gemini/antigravity-ide/scratch/discord-bot/node_modules/dotenv').config({ path: 'C:/Users/Administrator/.gemini/antigravity-ide/scratch/discord-bot/.env' });

const token = process.env.DISCORD_TOKEN;
const guildId = process.env.GUILD_ID;
const rest = new REST({ version: '10' }).setToken(token);

async function testMemberCheck() {
  try {
    const guild = await rest.get(Routes.guild(guildId) + '?with_counts=true');
    console.log(`Guild: ${guild.name}, Members: ${guild.approximate_member_count}, Online: ${guild.approximate_presence_count}`);
    
    // Search a member
    const search = await rest.get(Routes.guildMembersSearch(guildId) + '?query=7arbocha&limit=5');
    console.log("Search result for '7arbocha':", search.map(m => ({ id: m.user.id, tag: `${m.user.username}#${m.user.discriminator}`, nick: m.nick })));
  } catch (err) {
    console.error("Error:", err);
  }
}

testMemberCheck();
