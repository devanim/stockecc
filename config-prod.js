var databaseOptions = {
    "user": 'focusweb',
    "password": 'p8*J8bVYDHx3F.QzKL',
    "server": '194.61.80.1',
    "database": 'PORTALDB_LIVE',
    "dialect": "mssql",
    "port": 1433,
    "options": {
        trustedconnection: true,
        enableArithAbort: true,
        encrypt: false,
        instancename: 'SQLEXPRESS'  // SQL Server instance name
    },
    "pool": {
        max: 500,
        min: 0,
        idleTimeoutMillis: 500000
    },
    'connectionTimeout': 500000,
};

module.exports = databaseOptions;