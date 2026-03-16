require('dotenv').config();
const StreetRepository = require('../dao/street.repository');
const ConnectionPool = require('../dao/connection-pool');
const StreetEmbeddingsRepository = require("../dao/street-embeddings.repository");
const StreetEmbedder = require("./street.embedder.service");
const hooks = require('../utils/hooks');

const db = ConnectionPool.getConnection();
db.exec(`
    DROP TABLE IF EXISTS streets_embeddings;

    CREATE TABLE streets_embeddings
    (
        id                      TEXT PRIMARY KEY,
        streetId                INTEGER REFERENCES streets (id),
        current_name            TEXT,
        current_name_embeddings BLOB,
        old_name                TEXT,
        old_name_embeddings     BLOB
    );

    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA auto_vacuum = ON;
`);

hooks.registerShutdownHooks(() => ConnectionPool.releaseResources());
start();


async function start() {
    try {
        const start = new Date().getTime();
        const repository = new StreetRepository();
        const embeddingsRepository = new StreetEmbeddingsRepository();
        const embedder = new StreetEmbedder();
        const streetRows = repository.findAll();
        console.log(`Total street rows: ${streetRows.length}`);
        const embeddings = [];
        for (const row of streetRows) {
            embeddings.push(await embedder.convertToEmbedding(row));
        }
        console.log(`Total street embeddings rows: ${embeddings.length}`);
        embeddingsRepository.saveAll(embeddings);
        console.log(`Total street inserted embeddings rows: ${embeddingsRepository.count()}`);
        console.log(`Time to embed ${repository.count()} = ${(new Date().getTime() - start) / 1000} sec`);
    } finally {
        ConnectionPool.releaseResources();
    }
}