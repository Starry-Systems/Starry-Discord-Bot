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
    
    const status = member.presence ? member.presence.status : 'Offline';
    const activity = member.presence?.activities[0]?.name || 'None';

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
