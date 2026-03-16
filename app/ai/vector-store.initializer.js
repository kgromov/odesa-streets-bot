require('dotenv').config();
const Database = require('better-sqlite3');
const StreetRepository = require('../dao/street.repository');
const ConnectionPool = require('../dao/connection-pool');
const dbConfig = require('../config/db-config');
const StreetEmbeddingsRepository = require("../dao/street-embeddings.repository");
const StreetEmbedder = require("./street.embedder.service");

const db = ConnectionPool.getConnection();
db.exec(`
    CREATE TABLE IF NOT EXISTS streets_embeddings
    (
        id                      TEXT PRIMARY KEY,
        streetId                INTEGER REFERENCES streets(id),
        current_name            TEXT,
        current_name_embeddings BLOB,
        old_name                TEXT,
        old_name_embeddings     BLOB
    );

    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA auto_vacuum = ON;
`);
const repository = new StreetRepository(dbConfig.dbUrl);

start();

async function start() {
    // Graceful shutdown
    process.on('SIGINT', () => _shutdown());
    process.on('SIGTERM', () => _shutdown());

    const start = new Date().getTime();
    const embeddingsRepository = new StreetEmbeddingsRepository();
    const embedder = new StreetEmbedder();
    const streetRows = repository.findAll();
    console.log(`Total street rows: ${streetRows.length}`);
    const embeddings = await Promise.all(
        streetRows.map(row => embedder.convertToEmbedding(row))
    );
    console.log(`Total street embeddings rows: ${embeddings.length}`);
    embeddingsRepository.saveAll(embeddings);
    console.log(`Total street inserted embeddings rows: ${embeddingsRepository.count()}`);
    console.log(`Time to embed ${repository.count()} = ${(new Date().getTime() - start) / 1000} sec`);
}

function _shutdown() {
    console.log('\n👋  Shutting down…');
    ConnectionPool.releaseResources();
    process.exit(0);
}