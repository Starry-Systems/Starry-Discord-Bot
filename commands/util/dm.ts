const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

export const data = new SlashCommandBuilder()
  .setName("dm")
  .setDescription("Send a direct message to a user")
  .addUserOption(option =>
    option.setName("user")
      .setDescription("The user to DM")
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName("message")
      .setDescription("The message to send")
      .setRequired(true)
  );

export async function execute(interaction) {
  const user = interaction.options.getUser("user");
  const message = interaction.options.getString("message");

  // Try to send the DM
  try {
    // Send the DM to the user
    await user.send(message);
    await interaction.reply({
      content: `✅ Successfully sent a DM to ${user.tag}.`,
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
