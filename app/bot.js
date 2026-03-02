require('dotenv').config();
const path           = require('path');
const TelegramClient = require('./telegram.client');
const StreetBot      = require('./street.bot');

const TOKEN   = process.env.BOT_TOKEN;
const DB_PATH = path.join(__dirname, '/db/odessa_streets.db');

if (!TOKEN) {
  console.error('❌  Missing BOT_TOKEN environment variable.');
  console.error('    Set it and re-run:');
  console.error('    BOT_TOKEN=123:ABC node --experimental-sqlite app/bot.js');
  process.exit(1);
}

const client = new TelegramClient(TOKEN);
const bot    = new StreetBot(client, DB_PATH);

bot.start().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
