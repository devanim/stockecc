import pkg from 'mssql';

const { Table, VarChar, Decimal, Float, Int, DateTime } = pkg
// import Config from './config-dev.js';
import Config from './config-prod.js';

import Excel from 'exceljs';
import Conn from 'mssql';
import Path from 'path';
import Fs from 'fs';
import Moment from 'moment';

const FILE_EXTENSION = '.xlsx';
const FILE_AGE = 1800;
// const FILE_AGE = 1;
const FILE_PATH = '/home/euroestcar/public_html/new.euroestcar.ro/ftp_products_stock/';
// const FILE_PATH = './';
const TABLE_NAME = 'stockecc';

/** file to be parsed & loaded */
Fs.readdir(FILE_PATH, function (err, files) {
    if (err) {
        return console.log(new Date().toLocaleString().replace(/T/, ' ').replace(/\..+/, '') + ' | Unable to scan directory: ' + err);
    }
    files.filter(file => {
        if (Path.extname(file).toLowerCase() === FILE_EXTENSION) {
            console.log(new Date().toLocaleString().replace(/T/, ' ').replace(/\..+/, '') + ' | File name: ' + file);
            if (file) {
                /** fetch file details */
                Fs.stat(FILE_PATH + file, (err, stats) => {
                    if (err) {
                        throw err;
                    }
                    console.log(new Date().toLocaleString().replace(/T/, ' ').replace(/\..+/, '') + ' | File  last modified: ' + stats.ctime);

                    if (Moment(Moment().diff(stats.ctime, 'seconds')) < FILE_AGE) {
                        console.log(new Date().toLocaleString().replace(/T/, ' ').replace(/\..+/, '') + ' | Fisierul a fost uploadat acum mai putin de ' + FILE_AGE + ' de secunde');
                        throw err;
                    } else {
                        console.log(new Date().toLocaleString().replace(/T/, ' ').replace(/\..+/, '') + ' | Fisierul a fost uploadat acum mai mult de ' + FILE_AGE + ' de  secunde');

                        Conn.connect(Config, function (err) {
                            if (err) throw err;
                            var workbook = new Excel.Workbook();
                            workbook.xlsx.readFile(FILE_PATH + file)
                                .then(function () {
                                    console.log(new Date().toLocaleString().replace(/T/, ' ').replace(/\..+/, '') + ' | Truncating stockecc table');
                                    Conn.query("TRUNCATE TABLE [dbo].[stockecc]", function (err, result) {
                                        if (err) throw err;
                                        console.log(new Date().toLocaleString().replace(/T/, ' ').replace(/\..+/, '') + ' | Success');
                                    });

                                    /** read target table fields */
                                    var sql = 'SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = N\'' + TABLE_NAME + '\' ORDER BY ORDINAL_POSITION';
                                    Conn.query(sql, function (err, result) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            var cols = result.recordset;
                                            var table = new Table(TABLE_NAME);
                                            table.create = false;

                                            if ((typeof (cols) !== 'undefined') && (cols !== null)) {
                                                for (var i = 0; i < cols.length; i++) {
                                                    switch (cols[i]['DATA_TYPE']) {
                                                        case 'datetime':
                                                            table.columns.add(cols[i]['COLUMN_NAME'], DateTime, { nullable: false });
                                                            break;
                                                        case 'nvarchar':
                                                            table.columns.add(cols[i]['COLUMN_NAME'], VarChar(cols[i]['CHARACTER_MAXIMUM_LENGTH']), { nullable: true });
                                                            break;
                                                        case 'money':
                                                        case 'decimal':
                                                            table.columns.add(cols[i]['COLUMN_NAME'], Decimal(cols[i]['NUMERIC_PRECISION'], cols[i]['NUMERIC_SCALE']), { nullable: false });
                                                            break;
                                                        case 'int':
                                                            table.columns.add(cols[i]['COLUMN_NAME'], Int, { nullable: false });
                                                            break;
                                                        case 'float':
                                                            table.columns.add(cols[i]['COLUMN_NAME'], Float, { nullable: false });
                                                            break;
                                                        default:
                                                            //Cannot be mapped
                                                            break;
                                                    }
                                                }
                                            }

                                            /** get the records from the excel file */
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

                                                        /** change input type so that the bulk upload does not fail when trying to identify the type of field to load */
                                                        /** the reference number is sometimes a number and sometimes a string */

                                                        rowWithExtra[0] = rowWithExtra[0].toString();
                                                        rowWithExtra[1] = rowWithExtra[1].toString();
                                                        rowWithExtra[2] = rowWithExtra[2].toString();


                                                        /** ignore row which have stock or price values NaN or less than 0 */
                                                        if (typeof (rowWithExtra[4]) === 'number' && typeof (rowWithExtra[3]) === 'number' && rowWithExtra[4] > 0 && rowWithExtra[3] > 0) {

                                                            table.rows.add.apply(table.rows, rowWithExtra);
                                                        }
                                                    }
                                                });
                                            })
                                            /** insert into target table */

                                            var req = new Conn.Request();
                                            Conn.connect(Config, function (err) {
                                                if (err) {
                                                    console.log(err);
                                                }
                                                req.bulk(table, function (err, rowCount) {
                                                    if (err) {
                                                        console.log(err);
                                                        throw err;
                                                    } else {
                                                        console.log(new Date().toLocaleString().replace(/T/, ' ').replace(/\..+/, '') + ' | Data Loaded Successfully | ' + rowCount.rowsAffected + ' rows affected');

                                                        /** move inserted file to processed folder */
                                                        const currentPath = Path.join(FILE_PATH, "", file);
                                                        const destinationPath = Path.join(FILE_PATH, "processed", file);

                                                        Fs.rename(currentPath, destinationPath, function (err) {
                                                            if (err) {
                                                                throw err
                                                            } else {
                                                                console.log(new Date().toLocaleString().replace(/T/, ' ').replace(/\..+/, '') + ' | Successfully moved the file ');
                                                            }
                                                        });
                                                    }
                                                });
                                            });

                                        }
                                    });

                                });
                        });
                    }
                })
            }
        }
    });
});
