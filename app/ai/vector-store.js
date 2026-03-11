require('dotenv').config();
const aiModel = require('ollama').default;
const {v4: uuidv4} = require('uuid');
const Database = require('better-sqlite3');
const dbConfig = require('../config/db-config');
const aiConfig = require('../config/ai-config');


const DB = new Database(dbConfig.dbUrl);

class VectorStore {

    constructor(db) {
        this.db = db || DB;
        this.aiConfig = aiConfig;
    }

    async convertToEmbedding(streetRow) {
        console.log(JSON.stringify(streetRow));
        const [currentNameEmbeddings, oldNameEmbeddings] = await Promise.all([
            this.embed(streetRow.currentName),
            this.embed(streetRow.oldName)
        ]);
        await this.saveToDb(
            {
                ...streetRow,
                streetId: streetRow.id,
                currentNameEmbeddings,
                oldNameEmbeddings
            }
        );
    }

// TODO: move to StreetEmbeddingRepository
    async saveToDb(row) {
        const transaction = this.db.transaction(() => {
            const stmt = this.db.prepare(`
                INSERT INTO streets_embeddings
                VALUES (?, ?, ?, ?, ?, ?)
            `);
            stmt.run(
                uuidv4(),
                row.streetId,
                row.currentName,
                row.currentNameEmbeddings,
                row.oldName,
                row.oldNameEmbeddings
            );
        });

        transaction();
    }

    async embed(content) {
        const res = await aiModel.embed({
            model: this.aiConfig.embeddingModel,
            truncate: true,
            input: content,
        });
        console.log(JSON.stringify(res));
        return new Float32Array(res.embeddings.flat());
    }
}

module.exports = VectorStore;