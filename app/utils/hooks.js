const ConnectionPool = require("../dao/connection-pool");
exports.registerShutdownHooks = function (fn) {
    process.on('SIGINT', () => _shutdown());
    process.on('SIGTERM', () => _shutdown());
    process.on('uncaughtException', (err) => {
        console.error('Uncaught exception:', err);
        _shutdown();
    });
    process.on('unhandledRejection', (err) => {
        console.error('Unhandled rejection:', err);
        _shutdown();
    });
}

function _shutdown(fn) {
    console.log('\n👋  Shutting down…');
    fn();
    process.exit(0);
}