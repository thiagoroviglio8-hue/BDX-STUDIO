require('dotenv').config();
const { REST, Routes } = require('discord.js');
const { commands } = require('./commands');

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  console.error('Faltan DISCORD_TOKEN o CLIENT_ID en las variables de entorno.');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Registrando comandos slash globales...');
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log('Comandos globales registrados. Puede tardar un poco en aparecer en Discord.');
  } catch (error) {
    console.error('No se pudieron registrar los comandos:', error);
    process.exitCode = 1;
  }
})();
