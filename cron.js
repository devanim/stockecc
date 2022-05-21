//const Config = require('./config-dev.js');
const Config = require('./config-prod.js');

const Excel = require('exceljs');
const MSSql = require('mssql');
const SqlString = require('tsqlstring');
const Path = require('path');
const Fs = require('fs');
const Moment = require('moment')

const FILE_EXTENSION = '.xlsx';
const FILE_AGE = 1800;
const FILE_PATH = '/home/euroestcar/public_html/new.euroestcar.ro/ftp_products_stock/';

/** file to be parsed & loaded */
Fs.readdir(FILE_PATH, function (err, files) {

    if (err) {
        return console.log('[INFO] Unable to scan directory: ' + err);
    }

    files.filter(file => {

        if (Path.extname(file).toLowerCase() === FILE_EXTENSION) {
            console.log('[INFO] File name: ' + file);

            if (file) {
                //fetch file details
                Fs.stat(FILE_PATH + file, (err, stats) => {
                    if (err) {
                        throw err;
                    }
                    //console.log(`File Data Last Modified: ${stats.mtime}`);
                    console.log(`[INFO] File Status Last Modified: ${stats.ctime}`);

                    if (Moment(Moment().diff(stats.ctime, 'seconds')) < FILE_AGE) {
                        err = '[INFO] Fisierul a fost uploadat acum mai putin de ' + FILE_AGE + ' de milisecunde';
                        throw err;
                    } else {
                        console.log('[INFO] Fisierul a fost uploadat acum mai mult de ' + FILE_AGE + ' de milisecunde');

                        /** Schedule tasks to be run on the server. */
                        (async () => {
                            try {
                                let pool = await MSSql.connect(Config);
                                console.log('[INFO] Running  task every minute, check README.md for cron config');

                                var workbook = new Excel.Workbook();
                                workbook.xlsx.readFile(FILE_PATH + file)
                                    .then(function () {
                                        console.log('[INFO] Truncating stockecc table');
                                        pool.request().query("TRUNCATE TABLE [dbo].[stockecc]", function (err, result) {
                                            if (err) throw err;
                                            console.log('[INFO] Success');
                                        });

                                        // query to the database and get the records
                                        workbook.eachSheet((ws, sheetId) => {
                                            var worksheet = workbook.getWorksheet(sheetId);
                                            worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
                                                if (rowNumber > 1) {
                                                    /** add extra columns here */
                                                    const rowWithExtra = row.values;
                                                    rowWithExtra.push(stats.ctime);
                                                    rowWithExtra.push(worksheet.name);

                                                    /** indexing in xlsx files starts from number 1 (eg. A1 point to row 1 and column 1) */
                                                    /** setting null at the start is much easier than always recalculating from 0 based to 1 based indexing */
                                                    rowWithExtra.shift();
                                                    pool.request()
                                                        .query(SqlString.format("INSERT INTO [dbo].[stockecc] ([Reference],[Description],[Brand],[Stock],[Price],[CreatedDate],[BrandShort]) VALUES (?, ?, ?, ?, ?, ?, ?)", rowWithExtra), function (err, result) {
                                                            if (err) throw err;
                                                        });
                                                }
                                            });
                                        })
                                    });
                            } catch (err) {
                                console.log(err);
                                console.dir(err);
                            }
                        })()
                    }
                })
            }
        }
    });
});
