const { DatabaseSync } = require('node:sqlite');
const Street = require('./Street.js');

/**
 * Repository for querying renamed Odessa streets from a SQLite database.
 */
class StreetRepository {
  /**
   * @param {string} dbPath - Absolute or relative path to the .db file
   */
  constructor(dbPath) {
    this._db = new DatabaseSync(dbPath);
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
    return rows.map(row => new Street(row));
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
    return row ? new Street(row) : null;
  }

  // ─────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────

  /**
   * Returns every street in the database.
   * @returns {Street[]}
   */
  findAll() {
    return this._query('SELECT * FROM streets ORDER BY id');
  }

  /**
   * Finds a street by its primary key.
   * @param {number} id
   * @returns {Street|null}
   */
  findById(id) {
    return this._queryOne('SELECT * FROM streets WHERE id = ?', id);
  }

  /**
   * Finds multiple streets by their primary keys.
   * @param {number[]} ids
   * @returns {Street[]}
   */
  findAllByIds(ids) {
    if (!ids || ids.length === 0) {
      return [];
    }
    const placeholders = ids.map(() => '?').join(', ');
    return this._query(
        `SELECT * FROM streets WHERE id IN (${placeholders}) ORDER BY id`,
        ...ids
    );
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
      `SELECT * FROM streets
       WHERE  current_name LIKE ? OR old_name LIKE ?
       ORDER  BY current_name`,
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
      'SELECT * FROM streets WHERE current_name LIKE ? ORDER BY current_name',
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
      'SELECT * FROM streets WHERE old_name LIKE ? ORDER BY old_name',
      `%${term}%`
    );
  }

  /**
   * Returns only streets that have an associated article URL in notes.
   * @returns {Street[]}
   */
  findWithNotes() {
    return this._query(
      'SELECT * FROM streets WHERE notes IS NOT NULL ORDER BY current_name'
    );
  }

  /**
   * Returns the total number of records in the database.
   * @returns {number}
   */
  count() {
    const stmt = this._db.prepare('SELECT COUNT(*) AS total FROM streets');
    return stmt.get().total;
  }

  /**
   * Closes the underlying database connection.
   */
  close() {
    this._db.close();
  }
}

module.exports = StreetRepository;
