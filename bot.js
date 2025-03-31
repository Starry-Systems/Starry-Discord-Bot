const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  SlashCommandBuilder, 
  REST, 
  Routes, 
  ActivityType 
} = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences, 
  ],
});

// Allowed role for commands
const announcementRoleID = '1348773043287363611';
const allowedRoles = ['1348773043287363611']; // Who can use ?whois

client.once('ready', async () => {
  console.log('✅ Bot is online!');

  const commands = [
    // Plain message command
    new SlashCommandBuilder()
      .setName('say')
      .setDescription('Send a plain message as the bot')
      .addStringOption(option =>
        option.setName('message')
          .setDescription('The message to send')
          .setRequired(true)),

    // Embedded announcement command
    new SlashCommandBuilder()
      .setName('announce')
      .setDescription('Send an announcement with an embed')
      .addStringOption(option =>
        option.setName('message')
          .setDescription('The announcement message')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('from')
          .setDescription('Who should the message appear from?')
          .setRequired(true)
          .addChoices(
            { name: 'Me', value: 'me' },
            { name: 'A Role I Have', value: 'role' }
          ))
      .addStringOption(option =>
        option.setName('title')
          .setDescription('The announcement title (default: 📢 Announcement)')
          .setRequired(false))
      .addRoleOption(option =>
        option.setName('role')
          .setDescription('Select a role to announce from (only if you chose "A Role I Have")')
          .setRequired(false))
  ].map(command => command.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
  try {
    console.log('📌 Registering slash commands...');
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Slash commands registered!');
  } catch (error) {
    console.error('❌ Error registering slash commands:', error);
  }
});

// Handle /say (Plain Message)
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'say') {
    const messageText = interaction.options.getString('message');
    
    // Send as bot
    await interaction.channel.send(messageText);

    // Confirm execution
    await interaction.reply({ content: '✅ Message sent!', ephemeral: true });
  }

  // Handle /announce (Embed Announcement)
  if (interaction.commandName === 'announce') {
    const member = interaction.member;

    // Permission Check
    if (!member.roles.cache.has(announcementRoleID)) {
      return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
    }

    // Get Input
    const title = interaction.options.getString('title') || '📢 Announcement';
    const messageText = interaction.options.getString('message');
    const fromOption = interaction.options.getString('from');
    const selectedRole = interaction.options.getRole('role');

    let senderName;
    let senderAvatar;

    // Determine Sender
    if (fromOption === 'me') {
      senderName = member.displayName;
      senderAvatar = member.displayAvatarURL();
    } else if (fromOption === 'role' && selectedRole) {
      if (!member.roles.cache.has(selectedRole.id)) {
        return interaction.reply({ content: '❌ You can only send announcements from a role you are part of.', ephemeral: true });
      }
      senderName = selectedRole.name;
      senderAvatar = interaction.guild.iconURL();
    } else {
      return interaction.reply({ content: '❌ Invalid sender selection.', ephemeral: true });
    }

    // Create Announcement Embed
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(title)
      .setDescription(messageText)
      .setFooter({ text: `Sent by ${senderName}`, iconURL: senderAvatar })
      .setTimestamp();

    // Send Announcement
    await interaction.channel.send({ embeds: [embed] });

    // Confirm Execution
    await interaction.reply({ content: '✅ Announcement sent!', ephemeral: true });
  }
});

// Handle ?whois
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (message.content.startsWith('?whois')) {
    const args = message.content.split(' ');
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[1]) || message.member;

    if (!member) {
      return message.reply('❌ Could not find that user.');
    }

    // Check for permissions
    if (!message.member.roles.cache.some(role => allowedRoles.includes(role.id))) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    // Build user info embed
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`🔍 User Info: ${member.user.tag}`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '🆔 User ID', value: member.id, inline: true },
        { name: '📆 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: true },
        { name: '📅 Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`, inline: true },
        { name: '🎭 Roles', value: member.roles.cache.map(role => role.toString()).join(', ') || 'None' }
      )
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    // Send embed
    message.channel.send({ embeds: [embed] });
  }
});

client.login(process.env.BOT_TOKEN);
