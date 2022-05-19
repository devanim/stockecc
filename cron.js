const CRON = require('node-cron');
const EXCEL = require('exceljs');
const MYSQL = require('mysql');
const MOMENT = require('moment');

let connection = MYSQL.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'test'
});

connection.connect(function (err) {
    if (err) {
        return console.error('error: ' + err.message);
    }

    console.log('Connected to the MySQL server.');
});

// Schedule tasks to be run on the server.
CRON.schedule('* * * * *', function () {
    console.log('running a task every minute');
    var workbook = new EXCEL.Workbook();
    const filename = "STOCK-EEC-17052022.xlsx";
    workbook.xlsx.readFile(filename)
        .then(function () {
            workbook.eachSheet((ws, sheetId) => {
                var worksheet = workbook.getWorksheet(sheetId);
                worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {

                    if (rowNumber > 1) {
                        const rowWithExtra = row.values;
                        rowWithExtra.push(MOMENT(new Date()).format('YYYY-MM-DD HH:mm:ss'));
                        rowWithExtra.push(worksheet.name);

                        const rowValues = rowWithExtra.map(rowValue => {
                            return connection.escape(rowValue);
                        })
                        rowValues.shift();
                        const rowValuesForSQL = rowValues.join(',');

                        var sql = "INSERT INTO `stockeec` (`Reference`, `Description`, `Brand`, `Stock`, `Price`, `CreatedDate`, `BrandShort`) VALUES (" + rowValuesForSQL + ")";
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