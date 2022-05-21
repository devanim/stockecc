var databaseOptions = {
    "user": 'sa',
    "password": 'Ericsson10UK!',
    "server": 'localhost',
    "database": 'stocks',
    "dialect": "mssql",
    "port": 1433,
    "options": {
        trustedconnection: true,
        enableArithAbort: true,
        encrypt: false,
        instancename: 'MSSQLSERVER'  // SQL Server instance name
    },
    "pool": {
        max: 10,
        min: 1,
        idleTimeoutMillis: 30000
    }
};

module.exports = databaseOptions;