const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Comprueba si el bot está funcionando.'),
  new SlashCommandBuilder().setName('anuncio').setDescription('Publica un anuncio en un canal.')
    .addChannelOption(o => o.setName('canal').setDescription('Canal donde publicar').setRequired(true))
    .addStringOption(o => o.setName('mensaje').setDescription('Contenido del anuncio').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  new SlashCommandBuilder().setName('ticket-panel').setDescription('Publica el panel para abrir tickets.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  new SlashCommandBuilder().setName('sugerencia').setDescription('Envía una sugerencia para BDX Studio.')
    .addStringOption(o => o.setName('texto').setDescription('Tu sugerencia').setRequired(true)),
  new SlashCommandBuilder().setName('postulacion').setDescription('Abre el formulario de postulaciones.'),
  new SlashCommandBuilder().setName('limpiar').setDescription('Elimina mensajes recientes de un canal.')
    .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad (1 a 100)').setMinValue(1).setMaxValue(100).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  new SlashCommandBuilder().setName('expulsar').setDescription('Expulsa a un miembro.')
    .addUserOption(o => o.setName('usuario').setDescription('Miembro').setRequired(true))
    .addStringOption(o => o.setName('motivo').setDescription('Motivo').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  new SlashCommandBuilder().setName('banear').setDescription('Banea a un miembro.')
    .addUserOption(o => o.setName('usuario').setDescription('Miembro').setRequired(true))
    .addStringOption(o => o.setName('motivo').setDescription('Motivo').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
].map(c => c.toJSON());

module.exports = { commands };
