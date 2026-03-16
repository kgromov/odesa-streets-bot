const dbConfig = require('../config/db-config');
const Database = require("better-sqlite3");

class ConnectionPool {

    constructor() {
        this.connections = [];
    }

    getConnection() {
        if (this.connections.length === 0) {
            const newConnection = new Database(dbConfig.dbUrl);
            this.connections.push(newConnection);
        }
        return this.connections.pop();
    }

    closeConnection(connection) {
        if (connection?.open) {
            this.connections.push(connection);
        }
    }

    releaseResources() {
        console.log(`Close open connections`);
        this.connections.forEach(connection => connection.close());
        this.connections.length = 0;
    }
}

module.exports = new ConnectionPool();