const AbstractRepository = require("./abstract.repository");
const Street = require('../model/Street.js');

/**
 * Repository for querying renamed Odessa ${this._tableName()} from a SQLite database.
 */
class StreetRepository extends AbstractRepository {

    constructor() {
        super();
    }

    /**
     * Searches both the current and old name columns for the given term
     * (case-insensitive, partial match).
     *
     * @param {string} term - Substring to search for
     * @returns {Street[]}
     */
    findByOldOrNewName(term) {
        const like = `%${term}%`;
        return this._query(
            `SELECT * FROM ${this._tableName()}
             WHERE current_name LIKE ?
                OR old_name LIKE ?
             ORDER BY current_name`,
            like, like
        );
    }

    /**
     * Searches only the current (post-rename) name.
     * @param {string} term
     * @returns {Street[]}
     */
    findByCurrentName(term) {
        return this._query(
            `SELECT * FROM ${this._tableName()} WHERE current_name LIKE ? ORDER BY current_name`,
            `%${term}%`
        );
    }

    /**
     * Searches only the old (pre-rename) name.
     * @param {string} term
     * @returns {Street[]}
     */
    findByOldName(term) {
        return this._query(
            `SELECT * FROM ${this._tableName()} WHERE old_name LIKE ? ORDER BY old_name`,
            `%${term}%`
        );
    }

    /**
     * Returns only Streets that have an associated article URL in notes.
     * @returns {Street[]}
     */
    findWithNotes() {
        return this._query(`SELECT * FROM ${this._tableName()} WHERE notes IS NOT NULL ORDER BY current_name`);
    }

    _tableName() {
        return 'streets';
    }

    _mapToStreetEmbeddings(row) {
        return new Street(row);
    }

}

module.exports = StreetRepository;
