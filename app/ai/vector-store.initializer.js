require('dotenv').config();
const Database = require('better-sqlite3');
const StreetRepository = require('../street.repository');
const dbConfig = require('../config/db-config');
const VectorStore = require('./vector-store');

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

start();

async function start() {
    const start = new Date().getTime();
    const repository = new StreetRepository(dbConfig.dbUrl);
    const vectorStore = new VectorStore(db);
    const streetRows = repository.findAll();
    for (const row of streetRows) {
        await vectorStore.convertToEmbedding(row);
    }
    console.log(`Time to embed ${repository.count()} = ${(new Date().getTime() - start)/1000} sec`);
}