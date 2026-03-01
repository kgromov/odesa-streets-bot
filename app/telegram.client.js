'use strict';

/**
 * Minimal Telegram Bot API client built on top of the native fetch().
 * Implements long-polling via getUpdates — no external dependencies required.
 */
class TelegramClient {
  /**
   * @param {string} token - Bot token from @BotFather
   */
  constructor(token) {
    if (!token) throw new Error('Telegram bot token is required');
    this._base   = `https://api.telegram.org/bot${token}`;
    this._offset = 0;         // tracks the last processed update_id
    this._timeout = 30;       // long-poll timeout in seconds
  }

  // ─────────────────────────────────────────────
  // Low-level API wrapper
  // ─────────────────────────────────────────────

  /**
   * Calls a Telegram Bot API method.
   * @param {string} method  - e.g. 'getUpdates', 'sendMessage'
   * @param {object} [body]  - JSON payload
   * @returns {Promise<any>} - the `result` field of the Telegram response
   */
  async call(method, body = {}) {
    const res = await fetch(`${this._base}/${method}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} calling ${method}`);
    }

    const data = await res.json();

    if (!data.ok) {
      throw new Error(`Telegram API error [${method}]: ${data.description}`);
    }

    return data.result;
  }

  // ─────────────────────────────────────────────
  // Convenience methods
  // ─────────────────────────────────────────────

  /**
   * Fetches pending updates using long-polling.
   * Automatically advances the internal offset so each update is seen once.
   * @returns {Promise<TelegramUpdate[]>}
   */
  async getUpdates() {
    const updates = await this.call('getUpdates', {
      offset:           this._offset,
      timeout:          this._timeout,
      allowed_updates:  ['message'],
    });

    if (updates.length > 0) {
      this._offset = updates[updates.length - 1].update_id + 1;
    }

    return updates;
  }

  /**
   * Sends a text message to a chat.
   * @param {number|string} chatId
   * @param {string}        text       - Supports Markdown V2
   * @param {object}        [options]  - Extra Telegram sendMessage params
   * @returns {Promise<object>}        - The sent Message object
   */
  async sendMessage(chatId, text, options = {}) {
    return this.call('sendMessage', {
      chat_id:    chatId,
      text,
      parse_mode: 'MarkdownV2',
      ...options,
    });
  }

  /**
   * Sends a "typing…" chat action indicator.
   * @param {number|string} chatId
   */
  async sendTyping(chatId) {
    return this.call('sendChatAction', { chat_id: chatId, action: 'typing' });
  }

  /**
   * Returns basic info about the bot itself.
   * @returns {Promise<object>}
   */
  async getMe() {
    return this.call('getMe');
  }
}

module.exports = TelegramClient;
