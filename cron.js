const CRON = require('node-cron');
const EXCEL = require('exceljs');
const MYSQL = require('mysql');
const MOMENT = require('moment');

/** MySQL connection details */
let connection = MYSQL.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'test'
});

/** create connection to MySQL server */
connection.connect(function (err) {
    if (err) {
        return console.error('error: ' + err.message);
    }

    console.log('Connected to the MySQL server.');
});

/** file to be parsed & loaded */
const filename = "STOCK-EEC-17052022.xlsx";

/** Schedule tasks to be run on the server. */
CRON.schedule('* * * * *', function () {
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

                        /** escape strings */
                        const rowValues = rowWithExtra.map(rowValue => {
                            return connection.escape(rowValue);
                        })

                        /** indexing in xlsx files starts from number 1 (eg. A1 point to row 1 and column 1) */
                        /** setting null at the start is much easier than always recalculating from 0 based to 1 based indexing */
                        rowValues.shift();

                        /** join to creat the sql values */
                        const rowValuesForSQL = rowValues.join(',');

                        /** prepare SQL to insert */
                        var sql = "INSERT INTO `stockeec` (`Reference`, `Description`, `Brand`, `Stock`, `Price`, `CreatedDate`, `BrandShort`) VALUES (" + rowValuesForSQL + ")";

                        /** insert row */
                        connection.query(sql, function (err, result) {
                            if (err) throw err;
                            //console.log("1 record inserted");
                        });
                    }
                });
                console.log("Done sheet " + worksheet.name);
            })
        });
});