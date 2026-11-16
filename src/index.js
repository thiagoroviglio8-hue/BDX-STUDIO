require('dotenv').config();
const {
  Client, GatewayIntentBits, Partials, Events, EmbedBuilder, ActionRowBuilder,
  ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, ModalBuilder,
  TextInputBuilder, TextInputStyle, REST, Routes
} = require('discord.js');
const { commands } = require('./commands');

const required = ['DISCORD_TOKEN', 'CLIENT_ID'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Falta la variable obligatoria ${key}`);
    process.exit(1);
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel, Partials.Message]
});

const cooldowns = new Map();
const recentMessages = new Map();
const truthy = value => String(value).toLowerCase() === 'true';

async function sendLog(guild, description, color = 0x5865F2) {
  const id = process.env.LOG_CHANNEL_ID;
  if (!id) return;
  const channel = await guild.channels.fetch(id).catch(() => null);
  if (!channel?.isTextBased()) return;
  const embed = new EmbedBuilder().setColor(color).setDescription(description).setTimestamp();
  channel.send({ embeds: [embed] }).catch(() => {});
}

client.once(Events.ClientReady, readyClient => {
  console.log(`BDX Studio conectado como ${readyClient.user.tag}`);
  readyClient.user.setActivity('BDX Studio', { type: 3 });
});

client.on(Events.GuildMemberAdd, async member => {
  const id = process.env.WELCOME_CHANNEL_ID;
  if (!id) return;
  const channel = await member.guild.channels.fetch(id).catch(() => null);
  if (!channel?.isTextBased()) return;
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('¡Nuevo miembro en BDX Studio!')
    .setDescription(`¡Bienvenido/a ${member}!
Ahora somos **${member.guild.memberCount}** miembros.`)
    .setThumbnail(member.user.displayAvatarURL())
    .setTimestamp();
  channel.send({ embeds: [embed] }).catch(() => {});
});

client.on(Events.GuildMemberRemove, async member => {
  const id = process.env.GOODBYE_CHANNEL_ID;
  if (!id) return;
  const channel = await member.guild.channels.fetch(id).catch(() => null);
  if (channel?.isTextBased()) channel.send(`👋 **${member.user.tag}** salió de BDX Studio.`).catch(() => {});
});

client.on(Events.MessageCreate, async message => {
  if (!message.guild || message.author.bot) return;
  const now = Date.now();
  const key = `${message.guild.id}:${message.author.id}`;
  const times = (recentMessages.get(key) || []).filter(t => now - t < 7000);
  times.push(now);
  recentMessages.set(key, times);

  if (truthy(process.env.ANTI_SPAM) && times.length >= 6 &&
      !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
    await message.delete().catch(() => {});
    await message.channel.send({ content: `⚠️ ${message.author}, evita enviar mensajes repetidos o demasiado rápido.` })
      .then(m => setTimeout(() => m.delete().catch(() => {}), 5000)).catch(() => {});
    await sendLog(message.guild, `⚠️ Posible spam de ${message.author.tag} en ${message.channel}.`, 0xF1C40F);
    recentMessages.set(key, []);
    return;
  }

  if (truthy(process.env.ANTI_LINK) &&
      /(https?:\/\/|discord\.gg\/|www\.)/i.test(message.content) &&
      !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
    await message.delete().catch(() => {});
    await message.author.send('Tu mensaje fue eliminado porque los enlaces no están permitidos en este servidor.').catch(() => {});
    await sendLog(message.guild, `🔗 Enlace bloqueado de ${message.author.tag} en ${message.channel}.`, 0xE67E22);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const { commandName } = interaction;

      if (commandName === 'ping') {
        return interaction.reply({ content: `🏓 Pong: ${client.ws.ping} ms`, ephemeral: true });
      }

      if (commandName === 'anuncio') {
        const channel = interaction.options.getChannel('canal');
        const message = interaction.options.getString('mensaje');
        if (!channel.isTextBased() || !channel.send) {
          return interaction.reply({ content: 'Selecciona un canal de texto válido.', ephemeral: true });
        }
        const embed = new EmbedBuilder().setColor(0x5865F2).setTitle('📢 Anuncio | BDX Studio')
          .setDescription(message).setFooter({ text: `Publicado por ${interaction.user.tag}` }).setTimestamp();
        await channel.send({ embeds: [embed] });
        return interaction.reply({ content: '✅ Anuncio publicado.', ephemeral: true });
      }

      if (commandName === 'ticket-panel') {
        const embed = new EmbedBuilder().setColor(0x5865F2).setTitle('🎫 Centro de soporte | BDX Studio')
          .setDescription('¿Necesitas ayuda? Pulsa el botón para abrir un ticket privado con el equipo.');
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket_open').setLabel('Abrir ticket').setEmoji('🎫').setStyle(ButtonStyle.Primary)
        );
        await interaction.channel.send({ embeds: [embed], components: [row] });
        return interaction.reply({ content: '✅ Panel de tickets publicado.', ephemeral: true });
      }

      if (commandName === 'sugerencia') {
        const text = interaction.options.getString('texto');
        const id = process.env.SUGGESTIONS_CHANNEL_ID;
        const channel = id ? await interaction.guild.channels.fetch(id).catch(() => null) : interaction.channel;
        if (!channel?.isTextBased()) return interaction.reply({ content: 'Configura SUGGESTIONS_CHANNEL_ID o usa un canal de texto.', ephemeral: true });
        const embed = new EmbedBuilder().setColor(0x2ECC71).setTitle('💡 Nueva sugerencia')
          .setDescription(text).addFields({ name: 'Autor', value: interaction.user.tag }).setTimestamp();
        const sent = await channel.send({ embeds: [embed] });
        await sent.react('👍').catch(() => {});
        await sent.react('👎').catch(() => {});
        return interaction.reply({ content: '✅ Tu sugerencia fue enviada.', ephemeral: true });
      }

      if (commandName === 'postulacion') {
        const modal = new ModalBuilder().setCustomId('application_modal').setTitle('Postulación | BDX Studio');
        const age = new TextInputBuilder().setCustomId('age').setLabel('¿Qué edad tienes?').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(3);
        const role = new TextInputBuilder().setCustomId('role').setLabel('¿A qué puesto te postulas?').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(80);
        const experience = new TextInputBuilder().setCustomId('experience').setLabel('Cuéntanos tu experiencia y disponibilidad').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1000);
        modal.addComponents(
          new ActionRowBuilder().addComponents(age),
          new ActionRowBuilder().addComponents(role),
          new ActionRowBuilder().addComponents(experience)
        );
        return interaction.showModal(modal);
      }

      if (commandName === 'limpiar') {
        const amount = interaction.options.getInteger('cantidad');
        const deleted = await interaction.channel.bulkDelete(amount, true);
        return interaction.reply({ content: `🧹 Se eliminaron ${deleted.size} mensajes (Discord no permite borrar mensajes de más de 14 días).`, ephemeral: true });
      }

      if (commandName === 'expulsar' || commandName === 'banear') {
        const user = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('motivo') || 'Sin motivo especificado';
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) return interaction.reply({ content: 'No se encontró a ese miembro en el servidor.', ephemeral: true });
        if (!member.moderatable) return interaction.reply({ content: 'No puedo moderar a ese miembro. Revisa la jerarquía de roles y mis permisos.', ephemeral: true });
        if (commandName === 'expulsar') await member.kick(reason);
        else {
          if (!member.bannable) return interaction.reply({ content: 'No puedo banear a ese miembro. Revisa la jerarquía de roles y mis permisos.', ephemeral: true });
          await member.ban({ reason });
        }
        await sendLog(interaction.guild, `🛡️ ${user.tag} fue ${commandName === 'expulsar' ? 'expulsado' : 'baneado'} por ${interaction.user.tag}. Motivo: ${reason}`, 0xE74C3C);
        return interaction.reply({ content: `✅ ${user.tag} fue ${commandName === 'expulsar' ? 'expulsado' : 'baneado'}.`, ephemeral: true });
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId === 'ticket_open') {
        const existing = interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.user.id}`);
        if (existing) return interaction.reply({ content: `Ya tienes un ticket abierto: ${existing}`, ephemeral: true });

        const permissionOverwrites = [
          { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
          { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] }
        ];
        if (process.env.TICKET_SUPPORT_ROLE_ID) permissionOverwrites.push({
          id: process.env.TICKET_SUPPORT_ROLE_ID,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
        });

        const options = { name: `ticket-${interaction.user.id}`, type: ChannelType.GuildText, permissionOverwrites };
        if (process.env.TICKET_CATEGORY_ID) options.parent = process.env.TICKET_CATEGORY_ID;
        const channel = await interaction.guild.channels.create(options);
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket_close').setLabel('Cerrar ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒')
        );
        await channel.send({ content: `${interaction.user} gracias por contactar con el soporte de BDX Studio. Explica aquí tu consulta.`, components: [row] });
        return interaction.reply({ content: `✅ Ticket creado: ${channel}`, ephemeral: true });
      }

      if (interaction.customId === 'ticket_close') {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) &&
            !interaction.channel.name.startsWith('ticket-')) {
          return interaction.reply({ content: 'No tienes permiso para cerrar este ticket.', ephemeral: true });
        }
        await interaction.reply({ content: '🔒 Este ticket se cerrará en unos segundos.' });
        setTimeout(() => interaction.channel.delete('Ticket cerrado').catch(() => {}), 4000);
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'application_modal') {
      const channelId = process.env.APPLICATIONS_CHANNEL_ID;
      const channel = channelId ? await interaction.guild.channels.fetch(channelId).catch(() => null) : null;
      if (!channel?.isTextBased()) return interaction.reply({ content: 'El canal de postulaciones no está configurado. Contacta con el equipo.', ephemeral: true });
      const embed = new EmbedBuilder().setColor(0x5865F2).setTitle('📋 Nueva postulación')
        .addFields(
          { name: 'Usuario', value: `${interaction.user.tag} (${interaction.user.id})` },
          { name: 'Edad', value: interaction.fields.getTextInputValue('age') },
          { name: 'Puesto', value: interaction.fields.getTextInputValue('role') },
          { name: 'Experiencia y disponibilidad', value: interaction.fields.getTextInputValue('experience') }
        ).setTimestamp();
      await channel.send({ embeds: [embed] });
      return interaction.reply({ content: '✅ Tu postulación fue enviada al equipo.', ephemeral: true });
    }
  } catch (error) {
    console.error('Error procesando interacción:', error);
    const payload = { content: 'Ocurrió un error al ejecutar esta acción. Revisa los permisos y la configuración.', ephemeral: true };
    if (interaction.deferred || interaction.replied) await interaction.followUp(payload).catch(() => {});
    else await interaction.reply(payload).catch(() => {});
  }
});

client.on(Events.Error, error => console.error('Error del cliente Discord:', error));
process.on('unhandledRejection', error => console.error('Promesa rechazada:', error));

async function startBot() {
  try {
    console.log('Registrando comandos slash globales automáticamente...');
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log(`✅ ${commands.length} comandos slash registrados/actualizados.`);

    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    console.error('No se pudo iniciar el bot o registrar los comandos:', error);
    process.exit(1);
  }
}

startBot();
