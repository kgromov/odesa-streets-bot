class TelegramConfig {
    constructor() {
        this.botName = process.env.BOT_NAME;
        this.botToken = process.env.BOT_TOKEN;
    }
}

module.exports = new TelegramConfig();