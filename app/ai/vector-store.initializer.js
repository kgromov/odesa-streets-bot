require('dotenv').config();
const Database = require('better-sqlite3');
const StreetRepository = require('../dao/street.repository');
const ConnectionPool = require('../dao/connection-pool');
const dbConfig = require('../config/db-config');
const VectorStore = require('./vector-store');
const StreetEmbeddingsRepository = require("../dao/street-embeddings.repository");

const db = new Database(dbConfig.dbUrl);
db.exec(`
    CREATE TABLE IF NOT EXISTS streets_embeddings
    (
        id                      TEXT PRIMARY KEY,
        streetId                INTEGER,
        current_name            TEXT,
        current_name_embeddings BLOB,
        old_name                TEXT,
        old_name_embeddings     BLOB
    );

    PRAGMA journal_mode = WAL;
`);
const repository = new StreetRepository(dbConfig.dbUrl);

start();

async function start() {
    // Graceful shutdown
    process.on('SIGINT', () => _shutdown());
    process.on('SIGTERM', () => _shutdown());

    const start = new Date().getTime();
    const embeddingsRepository = new StreetEmbeddingsRepository();
    const vectorStore = new VectorStore(embeddingsRepository);
    const streetRows = repository.findAll();
    console.log(`Total street rows: ${streetRows.length}`);
    for (const row of streetRows) {
        await vectorStore.convertToEmbedding(row);
    }
    console.log(`Total street embeddings rows: ${embeddingsRepository.count()}`);
    console.log(`Time to embed ${repository.count()} = ${(new Date().getTime() - start) / 1000} sec`);
}

function _shutdown() {
    console.log('\n👋  Shutting down…');
    ConnectionPool.releaseResources()
    db.close();
    process.exit(0);
}