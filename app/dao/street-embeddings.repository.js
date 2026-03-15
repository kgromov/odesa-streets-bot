const Database = require("better-sqlite3");
const {v4: uuidv4} = require('uuid');
const ConnectionPool = require('./connection-pool');
const StreetEmbeddings = require("../model/StreetEmbeddings");

class StreetEmbeddingsRepository {

    constructor(dbPath) {
        this._db = ConnectionPool.getConnection();
    }

    findById(id) {
        return this._queryOne(`SELECT * FROM streets_embeddings WHERE id = ?`, id);
    }

    findByStreetId(streetId) {
        return this._queryOne(`SELECT * FROM streets_embeddings WHERE streetId = ?`, streetId);
    }

    findAll() {
        return this._query(`SELECT * FROM streets_embeddings`);
    }

    count() {
        const stmt = this._db.prepare('SELECT COUNT(*) AS total FROM streets_embeddings');
        return stmt.get().total;
    }

    async save(streetEmbeddings) {
        this.commit(() => {
            this._db.prepare(`
                INSERT INTO streets_embeddings
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(
                uuidv4(),
                streetEmbeddings.streetId,
                streetEmbeddings.currentName,
                streetEmbeddings.currentNameEmbeddings,
                streetEmbeddings.oldName,
                streetEmbeddings.oldNameEmbeddings
            );
        });
    }

    _query(sql, ...params) {
        const stmt = this._db.prepare(sql);
        const rows = stmt.all(...params);
        return rows.map(row => this.mapToStreetEmbeddings(row));
    }

    _queryOne(sql, ...params) {
        const stmt = this._db.prepare(sql);
        const row  = stmt.get(...params);
        return row ? this.mapToStreetEmbeddings(row) : null;
    }

    commit(fn) {
        this._db.transaction(fn)();
    }

    close() {
        ConnectionPool.closeConnection(this._db);
    }

    mapToStreetEmbeddings(row) {
        return new StreetEmbeddings({
            ...row,
            current_name_embeddings: new Float32Array(row.current_name_embeddings.buffer),
            old_name_embeddings: new Float32Array(row.old_name_embeddings.buffer),
        });
    }
}

module.exports = StreetEmbeddingsRepository;