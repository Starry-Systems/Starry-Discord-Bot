import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName("warn")
  .setDescription("Warn a member for a specified reason")
  .addUserOption(option =>
    option.setName("user")
      .setDescription("The user to warn")
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName("reason")
      .setDescription("The reason for the warning")
      .setRequired(true)
  );

export async function execute(interaction) {
  const user = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason");

  // Check if user has permission to warn (e.g., must not be an admin)
  if (!interaction.member.permissions.has("MANAGE_MESSAGES")) {
    return interaction.reply({
      content: "❌ You do not have permission to warn members.",
      ephemeral: true,
    });
  }

  // Send warning message to the mentioned user
  const warnMessage = `You have been warned in ${interaction.guild.name} for: ${reason}`;
  try {
    await user.send(warnMessage);
    await interaction.reply({
      content: `✅ Successfully warned ${user.tag} for: ${reason}`,
      ephemeral: true,
    });
  } catch (error) {
    console.error(`Error sending DM to ${user.tag}: ${error}`);
    await interaction.reply({
      content: `❌ Failed to send a DM to ${user.tag}. They may have DMs disabled.`,
      ephemeral: true,
    });
  }
}
