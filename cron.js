const CRON = require('node-cron');
const EXCEL = require('exceljs');
const MOMENT = require('moment');
var MSSQL = require('mssql');
const SqlString = require('tsqlstring');

/** MSSQL connection details */
var config = {
    "user": 'sa',
    "password": 'Ericsson10UK!',
    "server": 'localhost',
    "database": 'stocks',
    "dialect": "mssql",
    'connectionTimeout': 50000,
    "options": {
        trustedconnection: true,
        enableArithAbort: true,
        encrypt: false,
        useUTC: true,
        instancename: 'MSSQLSERVER'  // SQL Server instance name
    },
};

/** file to be parsed & loaded */
const filename = "STOCK-EEC-17052022.xlsx";

/** Schedule tasks to be run on the server. */
CRON.schedule('* * * * *', function () {
    (async () => {
        try {
            // connect to your database
            let pool = await MSSQL.connect(config);
            // create Request object
            const request = pool.request();
            // query to the database and get the records
            console.log('running  task every minute, check README.md for cron config');
            var workbook = new EXCEL.Workbook();
            workbook.xlsx.readFile(filename)
                .then(function () {
                    workbook.eachSheet((ws, sheetId) => {
                        var worksheet = workbook.getWorksheet(sheetId);
                        worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
                            if (rowNumber > 1) {
                                /** add extra columns here */
                                const rowWithExtra = row.values;
                                rowWithExtra.push(MOMENT(new Date()).format('YYYY-MM-DD HH:mm:ss'));
                                rowWithExtra.push(worksheet.name);

                                /** indexing in xlsx files starts from number 1 (eg. A1 point to row 1 and column 1) */
                                /** setting null at the start is much easier than always recalculating from 0 based to 1 based indexing */
                                rowWithExtra.shift();

                                /** prepare SQL to insert */
                                var sql = SqlString.format("INSERT INTO [dbo].[stockecc] ([Reference],[Description],[Brand],[Stock],[Price],[CreatedDate],[BrandShort]) VALUES (?, ?, ?, ?, ?, ?, ?)", rowWithExtra);

                                /** insert row */
                                request.query(sql, function (err, result) {
                                    if (err) throw err;
                                    console.log(result.rowsAffected);
                                });
                            }
                        });
                        console.log("Done sheet " + worksheet.name);
                    })
                });
        } catch (err) {
            // ... error checks
            console.log(err);
            console.dir(err);
        }
    })()
});