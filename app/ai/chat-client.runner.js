const aiConfig = require('app/config/ai-config');
const ChatClient = require("./chat-client");
const VectorStore = require("./vector-store");
const Database = require("better-sqlite3");
const dbConfig = require("../config/db-config");
const ollama = require('ollama').default;

chat('25 Чапаєвської дивізії');

async function chat(userQuery) {
    const db = new Database(dbConfig.dbUrl);
    const vectorStore = new VectorStore(db);
    const chatClient = new ChatClient(db, vectorStore);
    const query = await chatClient.checkSimilarity(userQuery);
    console.log("formatted query:", query);

    const message = { role: 'user', content: query };
    const response = await ollama.chat({ model: aiConfig.chatModel, messages: [message], stream: true });

    for await (const part of response) {
        process.stdout.write(part.message.content);
    }
}