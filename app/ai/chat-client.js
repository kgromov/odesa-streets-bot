const SIMILARITY_THRESHOLD = 0.8;

class ChatClient{
    constructor(embeddingsRepository, vectorStore){
        this.embeddingsRepository = embeddingsRepository;
        this.vectorStore = vectorStore;
    }

    async findStreets(query) {
        const streetEmbeddings = this.embeddingsRepository.findAll();
        console.log(`Fetched ${streetEmbeddings.length} rows`);
        const matchedStreets = [];
        if (streetEmbeddings.length > 0) {
            const embedding = await this.vectorStore.embed(query);
            for (const street of streetEmbeddings) {
                const currentNameEmbeddings = street.currentNameEmbeddings;
                const oldNameEmbeddings = street.oldNameEmbeddings;
                const currentNameSimilarity = this.cosineSimilarity(embedding, currentNameEmbeddings);
                const oldNameSimilarity = this.cosineSimilarity(embedding, oldNameEmbeddings);
                const similarity = Math.max(currentNameSimilarity, oldNameSimilarity);
                if (similarity > SIMILARITY_THRESHOLD) {
                    console.log(`Found similarity (${similarity}): ${street.toString()}`);
                    matchedStreets.push(street);
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