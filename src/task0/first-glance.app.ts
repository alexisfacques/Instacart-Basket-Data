import * as cp from 'child_process';

import * as fs from 'fs';
import{ Parser } from 'csv-parse';

/**
 * Folder in which the dataset files are.
 */
const __foldername: string = 'instacart_basket_data';

export class FirstGlance {
    constructor() {
        this.listFiles().then( (files: string[]) => {
            files
                .forEach( (file: string) => {
                    // Formatting to get absolute paths to files.
                    let filePath: string = `${__dirname}/../${__foldername}/${file}`;

                    // Reading file
                    this.readFile<any>(filePath)
                        // Logging the first two elements of the array
                        .then( (data: Array<any>) => {
                            console.log(`First two elements of file ${file}:`);
                            console.log(data.slice(0,2));
                        })
                })
        });
    }

    /**
     * Function executes a child_process listing the files in the instacart_basket_data folder
     * and returns the listed files though a Promise.
     */
    private listFiles(): Promise<string[]> {
        // Async behavior
        return new Promise( (resolve) => {
            // Listing the files in the instacart_basket_data folder.
            cp.exec(`ls ${__foldername}`)
                .stdout.on('data', (data: string) => {
                    // Formatting ls output as an Array of strings (representing the file names)
                    resolve(data.match(/[^\r\n]+/g));
                });
        });
    }

    /**
     * Function reads a .csv file and returns it properlly formatted.
     */
    private readFile<T>( filePath: string ): Promise<Array<T>> {
        // Async behavior
        return new Promise( (resolve, reject) => {
            let ret: Array<T> = [];

            // 'csv-parse' Parser, columns options groups each row by column in an object
            let parser: Parser = new Parser({
                    delimiter: ',',
                    columns: true
            });

            parser
                .on('data', (data: T) => ret.push(data) )
                .on('error', (error: any) => reject(error) )
                .on('end', () => resolve(ret) );

            // Reading the file and piping to parser
            fs.createReadStream(filePath).pipe(parser);
        });
    }
}
