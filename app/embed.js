const aiModel = require('ollama').default;
const {v4: uuidv4} = require('uuid');
const StreetRepository = require('./street.repository');
const Database = require('better-sqlite3');
const path = require("path");

const DB_PATH = path.join(__dirname, '/db/odessa_streets.db');
const db = new Database(DB_PATH);
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
    const repository = new StreetRepository(DB_PATH);
    const streetRows = repository.findAll();
    for (const row of streetRows) {
        await convertToEmbedding(row);
    }
    console.log(`Time to embed ${repository.count()} = ${(new Date().getTime() - start)/1000} sec`);
}

async function convertToEmbedding(streetRow) {
    console.log(JSON.stringify(streetRow));
    const [currentNameEmbeddings, oldNameEmbeddings] = await Promise.all([
        embed(streetRow.currentName),
        embed(streetRow.oldName)
    ]);
    await saveToDb({...streetRow, streetId: streetRow.id,  currentNameEmbeddings, oldNameEmbeddings});
}

async function saveToDb(row) {
    const transaction = db.transaction(() => {
        const stmt = db.prepare(`
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

async function embed(content) {
    const res = await aiModel.embed({
        model: "mxbai-embed-large",
        truncate: true,
        input: content,
    });
    console.log(JSON.stringify(res));
    return new Float32Array(res.embeddings.flat());
}