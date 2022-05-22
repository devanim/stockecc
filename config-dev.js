var Config = {
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
};

export default Config;
