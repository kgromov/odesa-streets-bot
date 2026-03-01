'use strict';

const StreetRepository = require('./street.repository.js');

// ── Telegram MarkdownV2 escaping ─────────────────────────────
// Characters that must be escaped: _ * [ ] ( ) ~ ` > # + - = | { } . !
const ESC_RE = /[_*[\]()~`>#+\-=|{}.!\\]/g;
const esc    = str => str.replace(ESC_RE, '\\$&');

// ─────────────────────────────────────────────────────────────
//  StreetBot
// ─────────────────────────────────────────────────────────────

/**
 * Handles Telegram updates and translates street name queries using
 * StreetRepository.  Works with any TelegramClient-compatible object.
 */
class StreetBot {
  /**
   * @param {object} telegramClient - Instance of TelegramClient
   * @param {string} dbPath         - Path to the SQLite database
   */
  constructor(telegramClient, dbPath) {
    this._tg   = telegramClient;
    this._repo = new StreetRepository(dbPath);
  }

  // ─────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────

  /**
   * Starts the long-polling loop.  Runs until the process is killed.
   */
  async start() {
    const me = await this._tg.getMe();
    console.log(`🤖  Bot started: @${me.username} (id ${me.id})`);
    console.log(`📂  Database: ${this._repo.count()} streets loaded`);
    console.log('    Waiting for messages…\n');

    // Graceful shutdown
    process.on('SIGINT',  () => this._shutdown());
    process.on('SIGTERM', () => this._shutdown());

    // Main loop
    while (true) {
      try {
        const updates = await this._tg.getUpdates();
        for (const update of updates) {
          await this._handleUpdate(update).catch(err =>
            console.error('Error handling update:', err)
          );
        }
      } catch (err) {
        console.error('Polling error:', err.message);
        await this._sleep(5_000);   // back-off before retrying
      }
    }
  }

  // ─────────────────────────────────────────────
  // Internal helpers
  // ─────────────────────────────────────────────

  /** Dispatches a single Telegram update. */
  async _handleUpdate(update) {
    const msg = update.message;
    if (!msg || !msg.text) return;

    const chatId = msg.chat.id;
    const text   = msg.text.trim();

    console.log(`[${new Date().toISOString()}] @${msg.from?.username ?? 'user'}: ${text}`);

    await this._tg.sendTyping(chatId);

    if (text.startsWith('/')) {
      await this._handleCommand(chatId, text);
    } else {
      await this._handleQuery(chatId, text);
    }
  }

  /** Handles /start and /help commands. */
  async _handleCommand(chatId, text) {
    const cmd = text.split(' ')[0].toLowerCase();

    if (cmd === '/start' || cmd === '/help') {
      const reply =
        `🗺 *Одеські вулиці — довідник перейменувань*\n\n` +
        `Надішліть мені *будь-яку частину* назви вулиці \\(стару або нову\\) ` +
        `— і я покажу обидві назви та пояснення\\.\n\n` +
        `*Приклади:*\n` +
        `• \`Пушкінська\`\n` +
        `• \`Гагаріна\`\n` +
        `• \`Героїв\`\n\n` +
        `_Пошук не враховує регістр і шукає як стару, так і нову назву\\._`;

      await this._tg.sendMessage(chatId, reply);
      return;
    }

    await this._tg.sendMessage(chatId,
      `Невідома команда\\. Введіть назву вулиці або скористайтеся /help\\.`
    );
  }

  /**
   * Handles a free-text street name query.
   * Searches both columns and formats a reply that clearly shows
   * which direction (old→new or new→old) each result represents.
   */
  async _handleQuery(chatId, query) {
    const streets = this._repo.findByOldOrNewName(query);

    if (streets.length === 0) {
      await this._tg.sendMessage(chatId,
        `🔍 За запитом *${esc(query)}* нічого не знайдено\\.\n\n` +
        `Спробуйте ввести частину назви, наприклад: \`Суворовська\`\\.`
      );
      return;
    }

    // Cap results to avoid Telegram's 4096-char message limit
    const MAX = 10;
    const shown    = streets.slice(0, MAX);
    const overflow = streets.length - MAX;

    const lines = shown.map(s => this._formatStreet(s, query));
    let reply    = lines.join('\n\n');

    if (overflow > 0) {
      reply += `\n\n_…та ще ${overflow} результат\\(ів\\)\\. Уточніть запит\\._`;
    }

    await this._tg.sendMessage(chatId, reply);
  }

  /**
   * Formats a single Street result for Telegram MarkdownV2.
   * Detects whether the query matched the old or new name and frames
   * the arrow accordingly.
   */
  _formatStreet(street, query) {
    const q        = query.toLowerCase();
    const matchOld = street.oldName.toLowerCase().includes(q);
    const matchNew = street.currentName.toLowerCase().includes(q);

    let arrow;
    if (matchOld && !matchNew) {
      // User typed the old name → show conversion to new
      arrow = `📛 *${esc(street.oldName)}*\n➡️ ${esc(street.currentName)}`;
    } else if (matchNew && !matchOld) {
      // User typed the new name → show what it used to be
      arrow = `🏷 *${esc(street.currentName)}*\n⬅️ _колишня_ ${esc(street.oldName)}`;
    } else {
      // Matched both columns (e.g. partial overlap) — show full pair
      arrow = `📛 ${esc(street.oldName)} ➡️ *${esc(street.currentName)}*`;
    }

    const notesLine = street.hasNotes()
      ? `\n📖 [Читати далі](${esc(street.notes)})`
      : '';

    return arrow + notesLine;
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  _shutdown() {
    console.log('\n👋  Shutting down…');
    this._repo.close();
    process.exit(0);
  }
}

module.exports = StreetBot;
