const { REST, Routes } = require('C:/Users/Administrator/.gemini/antigravity-ide/scratch/discord-bot/node_modules/discord.js');
require('C:/Users/Administrator/.gemini/antigravity-ide/scratch/discord-bot/node_modules/dotenv').config({ path: 'C:/Users/Administrator/.gemini/antigravity-ide/scratch/discord-bot/.env' });

const token = process.env.DISCORD_TOKEN;
const rest = new REST({ version: '10' }).setToken(token);

async function checkApp() {
  try {
    const app = await rest.get(Routes.currentApplication());
    console.log("=== APPLICATION DETAILS ===");
    console.log("ID:", app.id);
    console.log("Name:", app.name);
    console.log("Redirect URIs:", app.redirect_uris);
    console.log("Bot Public:", app.bot_public);
    console.log("RPC Origins:", app.rpc_origins);
  } catch (err) {
    console.error("Error fetching application details:", err.message);
  }
}

checkApp();
