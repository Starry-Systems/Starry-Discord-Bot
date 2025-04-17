const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

export const data = new SlashCommandBuilder()
  .setName("ban")
  .setDescription("Ban a member from the server")
  .addUserOption(option =>
    option.setName("user")
      .setDescription("The user to ban")
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName("reason")
      .setDescription("The reason for banning the user")
      .setRequired(false)
  );

export async function execute(interaction) {
  const user = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason") || "No reason provided";

  // Check if user has permission to ban (e.g., must not be an admin)
  if (!interaction.member.permissions.has("BAN_MEMBERS")) {
    return interaction.reply({
      content: "❌ You do not have permission to ban members.",
      ephemeral: true,
    });
  }

  // Ensure the bot has permission to ban
  if (!interaction.guild.members.me.permissions.has("BAN_MEMBERS")) {
    return interaction.reply({
      content: "❌ I do not have permission to ban members.",
      ephemeral: true,
    });
  }

  // Check if the user is banable (not an admin)
  const member = await interaction.guild.members.fetch(user.id);
  if (member.roles.highest.position >= interaction.member.roles.highest.position) {
    return interaction.reply({
      content: "❌ You cannot ban someone with an equal or higher role.",
      ephemeral: true,
    });
  }

  try {
    // Ban the member
    await member.ban({ reason });
    await interaction.reply({
      content: `✅ Successfully banned ${user.tag} for: ${reason}`,
      ephemeral: true,
    });
  } catch (error) {
    console.error(`Error banning ${user.tag}: ${error}`);
    await interaction.reply({
      content: `❌ Failed to ban ${user.tag}.`,
      ephemeral: true,
    });
  }
}
