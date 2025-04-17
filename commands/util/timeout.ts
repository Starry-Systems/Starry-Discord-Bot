import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("timeout")
  .setDescription("Timeout a member")
  .addUserOption(option =>
    option.setName("user")
      .setDescription("The user to timeout")
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName("duration")
      .setDescription("The duration of the timeout in seconds")
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName("reason")
      .setDescription("The reason for the timeout")
      .setRequired(false)
  );

export async function execute(interaction) {
  const user = interaction.options.getUser("user");
  const duration = interaction.options.getInteger("duration");
  const reason = interaction.options.getString("reason") || "No reason provided";

  // Check if user has permission to timeout (e.g., must not be an admin)
  if (!interaction.member.permissions.has("MODERATE_MEMBERS")) {
    return interaction.reply({
      content: "❌ You do not have permission to timeout members.",
      ephemeral: true,
    });
  }

  // Ensure the bot has permission to timeout
  if (!interaction.guild.members.me.permissions.has("MODERATE_MEMBERS")) {
    return interaction.reply({
      content: "❌ I do not have permission to timeout members.",
      ephemeral: true,
    });
  }

  // Check if the user is timeoutable (not an admin)
  const member = await interaction.guild.members.fetch(user.id);
  if (member.roles.highest.position >= interaction.member.roles.highest.position) {
    return interaction.reply({
      content: "❌ You cannot timeout someone with an equal or higher role.",
      ephemeral: true,
    });
  }

  try {
    // Timeout the member (duration is in milliseconds)
    await member.timeout(duration * 1000, reason); // Convert seconds to milliseconds
    await interaction.reply({
      content: `✅ Successfully timed out ${user.tag} for ${duration} seconds due to: ${reason}`,
      ephemeral: true,
    });
  } catch (error) {
    console.error(`Error timing out ${user.tag}: ${error}`);
    await interaction.reply({
      content: `❌ Failed to timeout ${user.tag}.`,
      ephemeral: true,
    });
  }
}
