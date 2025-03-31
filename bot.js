const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});


client.once('ready', () => {
  console.log('Bot is online!');
});

// List of greetings to match
const greetings = [
  'hello', 'hi', 'hiya', 'helo', 'hllo', 'hlLo', 'hlo', 'hey', 'yo', 'greetings'
];

// Listen for messages in any channel
client.on('messageCreate', (message) => {
  // Ignore the bot's own messages
  if (message.author.bot) return;

  // Check if the message is a greeting
  const messageContent = message.content.toLowerCase();
  for (const greeting of greetings) {
    if (messageContent.includes(greeting)) {
      message.channel.send('Hello! Welcome to Starry Systems!')
      break;
    }
  }
});
client.login(process.env.BOT_TOKEN);
