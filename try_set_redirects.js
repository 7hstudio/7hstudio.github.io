const { REST, Routes } = require('C:/Users/Administrator/.gemini/antigravity-ide/scratch/discord-bot/node_modules/discord.js');
require('C:/Users/Administrator/.gemini/antigravity-ide/scratch/discord-bot/node_modules/dotenv').config({ path: 'C:/Users/Administrator/.gemini/antigravity-ide/scratch/discord-bot/.env' });

const token = process.env.DISCORD_TOKEN;
const rest = new REST({ version: '10' }).setToken(token);

async function setRedirects() {
  try {
    const updated = await rest.patch(Routes.currentApplication(), {
      body: {
        redirect_uris: [
          "http://localhost:3000/api/auth/callback",
          "https://multi-bear-adam-wondering.trycloudflare.com/api/auth/callback"
        ]
      }
    });
    console.log("Successfully updated redirect_uris via API!", updated.redirect_uris);
  } catch (err) {
    console.log("Could not update via API:", err.message);
  }
}

setRedirects();
