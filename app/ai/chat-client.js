const aiConfig = require('../config/ai-config');
const ollama = require('ollama').default;

class ChatClient{
    constructor(db, vectorStore){
        this.db = db;
        this.vectorStore = vectorStore;
    }

    async chat(userQuery, sess) {
        const query = await this.checkSimilarity(userQuery, sess);
        console.log("formatted query:", query);

        const message = { role: 'user', content: query };
        const response = await ollama.chat({ model: aiConfig.chatModel, messages: [message], stream: true });

        for await (const part of response) {
            process.stdout.write(part.message.content);
        }
    }

    async checkSimilarity(query) {
        // TODO: move to StreetEmbeddingRepository
        const rows = this.db.prepare(`SELECT * FROM streets_embeddings`).all();
        console.log(`Fetched ${rows.length} rows`);
        const matchedStreets = [];
        if (rows.length > 0) {
            const embedding = await this.vectorStore.embed(query);
            for (const row of rows) {
                const currentNameEmbeddings = new Float32Array(row.current_name_embeddings.buffer); // from SQLite BLOB to float32array
                const oldNameEmbeddings = new Float32Array(row.old_name_embeddings.buffer); // from SQLite BLOB to float32array
                const currentNameSimilarity = this.cosineSimilarity(embedding, currentNameEmbeddings); // Compute similarity
                const oldNameSimilarity = this.cosineSimilarity(embedding, oldNameEmbeddings); // Compute similarity
                const similarity = Math.max(currentNameSimilarity, oldNameSimilarity);
                // if (row.streetId === 154) {
                //     console.log(`doc: ${row.streetId}, similarity: current = ${row.current_name} => ${currentNameSimilarity}, old = ${row.old_name} => ${oldNameSimilarity}`);
                // }
                if (similarity > 0.85) { // If similarity is > 2/3, include in matches
                    if (currentNameSimilarity >= oldNameSimilarity) {
                        matchedStreets.push(row.current_name);
                    } else {
                        matchedStreets.push(row.old_name);
                    }
                }
            }
        }
        console.log(`matched streets: ${JSON.stringify(matchedStreets)}, user query: ${query}`);
        return matchedStreets;
    }

    cosineSimilarity(v1, v2) {
        if (v1.length !== v2.length) {
            throw new Error("Vectors must be of the same length.");
        }
        let dot = 0, norm1Sq = 0, norm2Sq = 0;
        for (let i = 0; i < v1.length; i++) {
            dot += v1[i] * v2[i];
            norm1Sq += v1[i] * v1[i];
            norm2Sq += v2[i] * v2[i];
        }
        return dot / (Math.sqrt(norm1Sq) * Math.sqrt(norm2Sq)); // Returns a value between 0 and 1
    }
}
module.exports = ChatClient;