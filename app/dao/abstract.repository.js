'use strict';
const ConnectionPool = require('./connection-pool');

class AbstractRepository {

    constructor(dbPath) {
        if (new.target === AbstractRepository) {
            throw new Error("Cannot instantiate abstract repository directly");
        }
        this._db = ConnectionPool.getConnection();
    }

    findById(id, pk = 'id') {
        return this._queryOne(`SELECT * FROM ${this._tableName()} WHERE ${pk} = ?`, id);
    }

    findAll() {
        return this._query(`SELECT * FROM ${this._tableName()}`);
    }

    count() {
        const stmt = this._db.prepare('SELECT COUNT(*) AS total FROM ${this._tableName()}');
        return stmt.get().total;
    }

    _query(sql, ...params) {
        const stmt = this._db.prepare(sql);
        const rows = stmt.all(...params);
        return rows.map(row => this._mapToStreetEmbeddings(row));
    }

    _queryOne(sql, ...params) {
        const stmt = this._db.prepare(sql);
        const row  = stmt.get(...params);
        return row ? this._mapToStreetEmbeddings(row) : null;
    }

    _commit(fn) {
        this._db.transaction(fn)();
    }

    _tableName() {
        throw new Error('Should be defined in descendant');
    }

    _mapToStreetEmbeddings(row) {
        throw new Error('Should be defined in descendant');
    }
}

module.exports = AbstractRepository;