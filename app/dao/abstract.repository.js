'use strict';
const ConnectionPool = require('./connection-pool');

class AbstractRepository {

    constructor() {
        if (new.target === AbstractRepository) {
            throw new Error("Cannot instantiate abstract repository directly");
        }
        this._db = ConnectionPool.getConnection();
    }

    // ─────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────

    /**
     * Returns every street in the database.
     * @returns {Street[]}
     */
    findAll() {
        return this._query(`SELECT * FROM ${this._tableName()}`);
    }

    /**
     * Finds a street by its primary key.
     * @param {number} id
     * @param {string} pk - table primary key, default to 'id'
     * @returns {Street|null}
     */
    findById(id, pk = 'id') {
        return this._queryOne(`SELECT * FROM ${this._tableName()} WHERE ${pk} = ?`, id);
    }

    /**
     * Finds multiple streets by their primary keys.
     * @param {number[]} ids
     * @param {string} pk - table primary key, default to 'id'
     * @returns {Street[]}
     */
    findAllByIds(ids, pk = 'id') {
        if (!ids || ids.length === 0) {
            return [];
        }
        const placeholders = ids.map(() => '?').join(', ');
        return this._query(
            `SELECT * FROM ${this._tableName()} WHERE ${pk}  IN (${placeholders}) `,
            ...ids
        );
    }

    /**
     * Returns the total number of records in the database.
     * @returns {number}
     */
    count() {
        const stmt = this._db.prepare('SELECT COUNT(*) AS total FROM ${this._tableName()}');
        return stmt.get().total;
    }

    // ─────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────

    /**
     * Executes a prepared statement and maps the result rows to Street models.
     * @param {string} sql
     * @param {...*} params
     * @returns {Street[]}
     */
    _query(sql, ...params) {
        const stmt = this._db.prepare(sql);
        const rows = stmt.all(...params);
        return rows.map(row => this._mapToStreetEmbeddings(row));
    }

    /**
     * Executes a prepared statement expecting a single row.
     * @param {string} sql
     * @param {...*} params
     * @returns {Street|null}
     */
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