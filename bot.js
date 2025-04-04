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

// Allowed role for /say command
const announcementRoleID = '1348773043287363611';
const allowedRoles = ['1348773043287363611']; // Who can use ?whois

client.once('ready', async () => {
  console.log('✅ Bot is online!');

  const commands = [
    new SlashCommandBuilder()
      .setName('say')
      .setDescription('Send an announcement')
      .addStringOption(option =>
        option.setName('message')
          .setDescription('The announcement message Please Only Do It In The announcement channel')
          .setRequired(true))  // ✅ Required option comes first
      .addStringOption(option =>
        option.setName('from')
          .setDescription('Who should the message appear from?')
          .setRequired(true)
          .addChoices(
            { name: 'Me', value: 'me' },
            { name: 'A Role I Have', value: 'role' }
          ))  // ✅ Required option comes second
      .addStringOption(option =>
        option.setName('title')
          .setDescription('The announcement title (default: 📢 Announcement)')
          .setRequired(false))  // ✅ Optional
      .addRoleOption(option =>
        option.setName('role')
          .setDescription('Select a role to announce from (only if you chose "A Role I Have")')
          .setRequired(false))  // ✅ Optional
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

// 🔹 ?whois Command
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(' ');
  if (args[0] === '?whois') {
    // Check if user has permission
    if (!message.member.roles.cache.some(role => allowedRoles.includes(role.id))) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    // Get mentioned user or sender
    const user = message.mentions.users.first() || message.author;
    const member = message.guild.members.cache.get(user.id);
    await member.fetch(); // Ensure we have updated info

    // User Information
    const pfp = user.displayAvatarURL({ dynamic: true, size: 1024 });
    const username = user.username;
    const displayName = member.displayName;
    const joinedDiscord = `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`;
    const joinedGuild = `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`;
    const roles = member.roles.cache
      .filter(role => role.id !== message.guild.id)
      .map(role => role)
      .join(', ') || 'No roles';

    // 🔹 Status & Activity
    const status = member.presence?.status 
      ? member.presence.status.charAt(0).toUpperCase() + member.presence.status.slice(1) // Capitalize status
      : 'Unknown';

    let activity = 'None';
    if (member.presence?.activities.length > 0) {
      const act = member.presence.activities[0];

      switch (act.type) {
        case ActivityType.Playing:
          activity = `🎮 Playing **${act.name}**`;
          break;
        case ActivityType.Streaming:
          activity = `📺 Streaming **${act.name}** on [Twitch](${act.url})`;
          break;
        case ActivityType.Listening:
          activity = `🎵 Listening to **${act.name}**`;
          break;
        case ActivityType.Watching:
          activity = `👀 Watching **${act.name}**`;
          break;
        case ActivityType.Custom:
          activity = `💬 ${act.state}`;
          break;
        default:
          activity = 'None';
      }
    }

    // User Badges
    const badges = user.flags 
      ? user.flags.toArray().map(flag => `🏅 ${flag}`).join(', ') 
      : 'No badges';

    // Create Embed
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle(`${displayName}?`)
      .setThumbnail(pfp)
      .addFields(
        { name: 'Username', value: username, inline: true },
        { name: 'Display Name', value: displayName, inline: true },
        { name: 'Joined Discord', value: joinedDiscord, inline: true },
        { name: 'Joined Server', value: joinedGuild, inline: true },
        { name: 'Roles', value: roles, inline: false },
        { name: 'Status', value: status, inline: true },
        { name: 'Activity', value: activity, inline: true },
        { name: 'Badges', value: badges, inline: false }
      )
      .setFooter({ text: `Requested by ${message.author.username}` });

    message.channel.send({ embeds: [embed] });
  }
});

// 🔹 Handle /say Slash Command
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'say') {
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

client.login(process.env.BOT_TOKEN);
