class AiConfig {
    constructor() {
        this.chatModel = process.env.CHAT_MODEL;
        this.embeddingModel = process.env.EMBEDDING_MODEL;
    }
}

module.exports = new AiConfig();