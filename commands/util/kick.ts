const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

export const data = new SlashCommandBuilder()
  .setName("kick")
  .setDescription("Kick a member from the server")
  .addUserOption(option =>
    option.setName("user")
      .setDescription("The user to kick")
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName("reason")
      .setDescription("The reason for kicking the user")
      .setRequired(false)
  );

export async function execute(interaction) {
  const user = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason") || "No reason provided";

  // Check if user has permission to kick (e.g., must not be an admin)
  if (!interaction.member.permissions.has("KICK_MEMBERS")) {
    return interaction.reply({
      content: "❌ You do not have permission to kick members.",
      ephemeral: true,
    });
  }

  // Ensure the bot has permission to kick
  if (!interaction.guild.members.me.permissions.has("KICK_MEMBERS")) {
    return interaction.reply({
      content: "❌ I do not have permission to kick members.",
      ephemeral: true,
    });
  }

  // Check if the user is kickable (not an admin)
  const member = await interaction.guild.members.fetch(user.id);
  if (member.roles.highest.position >= interaction.member.roles.highest.position) {
    return interaction.reply({
      content: "❌ You cannot kick someone with an equal or higher role.",
      ephemeral: true,
    });
  }

  try {
    // Kick the member
    await member.kick(reason);
    await interaction.reply({
      content: `✅ Successfully kicked ${user.tag} for: ${reason}`,
      ephemeral: true,
    });
  } catch (error) {
    console.error(`Error kicking ${user.tag}: ${error}`);
    await interaction.reply({
      content: `❌ Failed to kick ${user.tag}.`,
      ephemeral: true,
    });
  }
}
