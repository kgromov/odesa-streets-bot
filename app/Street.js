/**
 * Represents a renamed street in Odessa.
 */
class Street {
  /**
   * @param {object} raw - Raw row from the database
   * @param {number} raw.id
   * @param {string} raw.current_name
   * @param {string} raw.old_name
   * @param {string|null} raw.notes
   */
  constructor({ id, current_name, old_name, notes }) {
    this.id          = id;
    this.currentName = current_name;
    this.oldName     = old_name;
    this.notes       = notes ?? null;
  }

  /**
   * Returns true if this street has a reference article URL.
   * @returns {boolean}
   */
  hasNotes() {
    return this.notes !== null;
  }

  /**
   * Returns a human-readable summary of the rename.
   * @returns {string}
   */
  toString() {
    return `[${this.id}] "${this.oldName}" → "${this.currentName}"` +
      (this.hasNotes() ? ` (📖 ${this.notes})` : '');
  }

  /**
   * Serialises the model to a plain object (useful for JSON responses).
   * @returns {object}
   */
  toJSON() {
    return {
      id:          this.id,
      currentName: this.currentName,
      oldName:     this.oldName,
      notes:       this.notes,
    };
  }
}

module.exports = Street;
