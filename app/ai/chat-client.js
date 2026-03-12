const StreetEmbeddings = require("../StreetEmbeddings");

const SIMILARITY_THRESHOLD = 0.75;

class ChatClient{
    constructor(db, vectorStore){
        this.db = db;
        this.vectorStore = vectorStore;
    }

    async findStreets(query) {
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
                if (similarity > SIMILARITY_THRESHOLD) {
                    const streetEmbeddings = new StreetEmbeddings(row);
                    console.log(`Found similarity (${similarity}): ${streetEmbeddings.toString()}`);
                    matchedStreets.push(streetEmbeddings);
                }
            }
        }
        console.log(`matched streets: ${JSON.stringify(matchedStreets.map(e => e.toString()))}, user query: ${query}`);
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