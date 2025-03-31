const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  PermissionsBitField 
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

// Define allowed roles (replace with your role IDs)
const allowedRoles = ['1348773043287363611']; // Add your role IDs here

client.once('ready', () => {
  console.log('Bot is online!');
});

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

    // Fetch user data
    await member.fetch(); // Ensure we have updated info

    // Get user details
    const pfp = user.displayAvatarURL({ dynamic: true, size: 1024 });
    const username = user.username;
    const displayName = member.displayName;
    const joinedDiscord = `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`;
    const joinedGuild = `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`;
    const roles = member.roles.cache
      .filter(role => role.id !== message.guild.id)
      .map(role => role)
      .join(', ') || 'No roles';
    
    // Fetch correct activity
    let activity = 'None';
    if (member.presence?.activities.length > 0) {
      const activityType = member.presence.activities[0].type; // Get activity type (Playing, Listening, etc.)
      const activityName = member.presence.activities[0].name; // Activity name
      activity = `${activityType === 0 ? 'Playing' : activityType === 2 ? 'Listening to' : activityType === 3 ? 'Watching' : 'Custom'} ${activityName}`;
    }

    // User badges (if available)
    const badges = user.flags ? user.flags.toArray().join(', ') : 'No badges';

    // Create embed
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

client.login(process.env.BOT_TOKEN);
// Define announcement role ID (Change this to your actual role ID)
const announcementRoleID = '1348773043287363611';

// Register the /say slash command
const commands = [
  new SlashCommandBuilder()
    .setName('say')
    .setDescription('Send an announcement')
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
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Select a role to announce from (only if you chose "A Role I Have")')
        .setRequired(false))
].map(command => command.toJSON());

// Deploy the command
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
client.once('ready', async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('✅ Slash commands registered!');
  } catch (error) {
    console.error('Error registering slash commands:', error);
  }
});

// Handle slash command execution
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'say') {
    const member = interaction.member;
    
    // Check if user has the announcement role
    if (!member.roles.cache.has(announcementRoleID)) {
      return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
    }

    // Get user input
    const messageText = interaction.options.getString('message');
    const fromOption = interaction.options.getString('from');
    const selectedRole = interaction.options.getRole('role');

    let senderName;
    let senderAvatar;
    let isRoleSender = false;

    // Determine sender
    if (fromOption === 'me') {
      senderName = member.displayName;
      senderAvatar = member.displayAvatarURL();
    } else if (fromOption === 'role' && selectedRole) {
      if (!member.roles.cache.has(selectedRole.id)) {
        return interaction.reply({ content: '❌ You can only send announcements from a role you are part of.', ephemeral: true });
      }
      senderName = selectedRole.name;
      senderAvatar = interaction.guild.iconURL();
      isRoleSender = true;
    } else {
      return interaction.reply({ content: '❌ Invalid selection for the sender.', ephemeral: true });
    }

    // Create announcement embed
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('📢 Announcement')
      .setDescription(messageText)
      .setFooter({ text: `Sent by ${senderName}`, iconURL: senderAvatar })
      .setTimestamp();

    // Send message
    await interaction.channel.send({ embeds: [embed] });

    // Confirm command execution
    await interaction.reply({ content: '✅ Announcement sent!', ephemeral: true });
  }
});
