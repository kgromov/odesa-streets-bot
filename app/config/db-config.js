const path = require("path");

class DbConfig {
    constructor() {
       this.dbUrl = path.join(__dirname, '../db/odessa_streets.db');
    }
}

module.exports = new DbConfig();