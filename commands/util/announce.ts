const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

export const data = new SlashCommandBuilder()
  .setName("announce")
  .setDescription("Send an announcement to a specific channel.")
  .addStringOption(option =>
    option.setName("message").setDescription("The message to announce").setRequired(true)
  );

export async function execute(interaction) {
  const message = interaction.options.getString("message");
  const roleId = "1348773043312525437";
  await interaction.reply({ content: "📢 Announcement sent!", ephemeral: true });
  await interaction.channel.send(`<@&${roleId}> ${message}`);
}
