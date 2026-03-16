require('dotenv').config();
const aiModel = require('ollama').default;
const aiConfig = require('../config/ai-config');

class StreetEmbedder {

    constructor() {
    }

    async convertToEmbedding(streetRow) {
        console.log(JSON.stringify(streetRow));
        const [currentNameEmbeddings, oldNameEmbeddings] = await Promise.all([
            this.embed(streetRow.currentName),
            this.embed(streetRow.oldName)
        ]);
       return {
           ...streetRow,
           streetId: streetRow.id,
           currentNameEmbeddings,
           oldNameEmbeddings
       };
    }

    async embed(content) {
        const res = await aiModel.embed({
            model: aiConfig.embeddingModel,
            truncate: true,
            input: content,
        });
        // console.log(JSON.stringify(res));
        return new Float32Array(res.embeddings.flat());
    }
}

module.exports = StreetEmbedder;