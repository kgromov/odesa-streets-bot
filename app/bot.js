require('dotenv').config();
const TelegramClient = require('./telegram.client');
const StreetBot      = require('./street.bot');
const botConfig = require('./config/bot-config');

if (!botConfig.botToken) {
  console.error('❌  Missing BOT_TOKEN environment variable.');
  console.error('    Set it and re-run:');
  console.error('    BOT_TOKEN=123:ABC node --experimental-sqlite app/bot.js');
  process.exit(1);
}

const client = new TelegramClient(botConfig.botToken);
const bot    = new StreetBot(client);

bot.start().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
