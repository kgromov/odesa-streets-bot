require('dotenv').config();
const aiConfig = require('../config/ai-config');
const ChatClient = require("./chat-client");
const dbConfig = require("../config/db-config");
const StreetEmbeddingsRepository = require("../dao/street-embeddings.repository");
const StreetEmbedder = require("./street.embedder.service");
const ollama = require('ollama').default;

const embeddingsRepository = new StreetEmbeddingsRepository(dbConfig.dbUrl);

chat('25 Чапаєвської дивізії');

async function chat(userQuery) {
    process.on('SIGINT', () => _shutdown());
    process.on('SIGTERM', () => _shutdown());

    const embeddingsRepository = new StreetEmbeddingsRepository(dbConfig.dbUrl);
    const vectorStore = new StreetEmbedder();
    const chatClient = new ChatClient(embeddingsRepository, vectorStore);
    const query = await chatClient.findStreets(userQuery)
    console.log("formatted query:", query);

    const message = { role: 'user', content: query.join('\n')};
    const response = await ollama.chat({ model: aiConfig.chatModel, messages: [message], stream: true });

    for await (const part of response) {
        process.stdout.write(part.message.content);
    }
}

function _shutdown() {
    console.log('\n👋  Shutting down…');
    embeddingsRepository.close();
    process.exit(0);
}