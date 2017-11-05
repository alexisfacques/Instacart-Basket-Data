import * as cp from 'child_process';
import * as fs from 'fs';

import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/finally';

import { CSVParser } from './csv-parser.class';

export interface ItemSet {
    items: string[],
    support: number
}

export interface Rule {
    support: number,
    confidence: number,
    items: string[],
    results: string[]
}

export interface SPMFStats {
    candidates?: number,
    executionTime?: number,
    memory?: number,
}

export interface Sequence {
    itemsets: string[][],
    support: number
}

export interface SPMFResults<T extends ItemSet | Rule | Sequence> {
    stats?: SPMFStats,
    output: T[],
}

export class SPMF {
    /**
     * Data if input is not a file.
     */
    private _data: string = undefined;

    /**
     * Input file path.
     */
    private file: string = undefined;

    /**
     * Encapsulation tool for JAVA Library SPMF.
     * @param  {string} algorithm        The algorithm you want to run.
     * @param  {string} spmfPat          Optionnal: Path to the spmf.jar file (default is root folder).
     * @param  {string} _outputDirectory Optionnal: Path to your working directory if you want to keep SPMF outputs. Default is '/tmp' folder.
     */
    constructor( private algorithm: string, private _spmfPath: string = `${__dirname}/../../spmf.jar`, private _outputDirectory: string = '/tmp' ) {
    }

    /**
     * Input from a spmf-friendly formatted file.
     * @param  {string} file Path to the file.
     * @return {SPMF}        Itself.
     */
    public fromFile( file: string ): SPMF {
        if(this._data) throw new Error('String already provided as an input');
        this.file = file;
        return this;
    }

    /**
     * Input from a preformatted string. (Items must be sort ascendingly and separated by a plain space character, 1 transaction per line).
     * @param  {string[]} data The string to input.
     * @return {SPMF}          Itself.
     */
    public fromString( data: string ): SPMF {
        this._data = data;
        return this;
    }

    /**
     * Executes the Algorithm with the proper support and confidence (if mining association rules).
     * Listen for results through the Observable returned.
     * @param  {number}                  support    Minimum support IN PERCENT
     * @param  {number}                  confidence Optional: Minimum confidence IN PERCENT
     * @return {Observable<SPMFResults>}            The Observable which will emit results.
     */
    public exec<T extends ItemSet | Rule | Sequence>( support: number, confidence?: number ): Observable<SPMFResults<T>> {
        let outputFile: string = `/tmp/${new Date().getTime()}_itemsets_${this.algorithm}_${support}.txt`;

        // Pushing data here when available
        let dataSubject: Subject<SPMFResults<T>> = new Subject<SPMFResults<T>>();
        // Calling this Subject on child_process close.
        let closeSubject: Subject<void> = new Subject<void>();

        // Main child_process (command exection) which is encapsulated here.
        let spmf: cp.ChildProcess;

        // Stats of execution
        let stats: SPMFStats = {};

        this._ifArrayWriteFile()
            .then( () => {
                // Arguments needed in order to run the algorithms.
                let args: string[] = this._getArguments().concat([outputFile, support+'%']);
                if(confidence) args.push(confidence+'%');

                // Main child_process (command exection) which is encapsulated here.
                spmf = cp.spawn('java', args);
                spmf.stdout.on('data', (data: Buffer) => this._parseStdout(stats,data.toString()) );
                // Close Observable encapsulation.
                spmf.on('close', (code: number) => {
                    // Gathering results (actually not using the CSV parser anymore (that explains the silly delimiter), using RegExp to match rows)
                    new CSVParser<string[]>(outputFile, { delimiter: '\n\r' }).loadAll()
                        // Once the data is loaded from the file...
                        .then(  (table: Array<string[]>) => {
                            // ...creating itemsets or rules.
                            let results: T[] = table.map( (row: string[]) => <T> this._formatResultRow(row[0]) );

                            // ... then pushing the data through the Observable.
                            dataSubject.next({
                                stats: stats,
                                output: results
                            });

                            // Then closing the Observable, as we're done here
                            closeSubject.next();
                        })


                });
            })

        return dataSubject
            .asObservable()
            .takeUntil(closeSubject)
            .finally( () => {
                if(spmf) spmf.kill();
                closeSubject.complete();
            });
    }

    /**
     * Returns all the command arguments ordered in an Array. ChildProcess-ready.
     * @return {Array<string>} The array you expect.
     */
    private _getArguments(): Array<string> {
        if(!this.file) throw new Error('You must provide an input');
        return ['-jar', this._spmfPath, 'run', this.algorithm, this.file]
    }

    /**
     * If input is a string, saving it to a file.
     * @return {Promise<void>} Notifies when file saving is done.
     */
    private _ifArrayWriteFile(): Promise<void> {
        // Async behavior
        return new Promise( (resolve, reject) => {
            // If no data is input, continue.
            if(!this._data) return resolve();

            // Else save to a temporary file.
            this.file = `/tmp/${new Date().getTime()}_dataset_${this.algorithm}.txt`;
            // Writing temporary file
            fs.writeFile(this.file, this._data, (err: any) => {
                if(err) return reject();
                resolve();
            });
        });
    }

    /**
     * Parses stdOut from SPMF and updates SPMFStats object.
     * @param {SPMFStats}    stats  The object to update.
     * @param {string}       stdout Stdout.
     */
    private _parseStdout( stats: SPMFStats = {}, stdout: string ): void {
        stats.candidates = this._matchAndParseInt(stdout, /(Candidates count : \d*)/g) || stats.candidates;
        stats.executionTime = this._matchAndParseInt(stdout, /(Total time ~(:)* \d* ms)/g) || stats.executionTime;
        stats.memory = this._matchAndParseInt(stdout, /(Maximum memory usage : \d*\.\d* mb)/g) || stats.memory;
    }

    /**
     * If string matches RegExp, parsing and returning the matched Integer value found.
     * @param  {string} str    The string to test.
     * @param  {RegExp} regExp The RegExp.
     * @return {number}        The Integer to be returned.
     */
    private _matchAndParseInt( str: string, regExp: RegExp ): number {
        let match: string[] = str.match(regExp)
        if(!match) return null;
        return match[0].match(/(\d)+(\.)*(\d)*/g).map(Number)[0];
    }

    private _formatResultRow( row: string ): Rule | ItemSet | Sequence {
        switch(this._getTypeOfResult(row)) {
            case 'Rule':
                return this._getRule(row);
            case 'ItemSet':
                return this._getItemSet(row);
            case 'Sequence':
                return this._getSequence(row);
            default:
                throw new Error('Unknown output file format');
        }
    }

    private _getItemSet( row: string ): ItemSet {
        return {
            support: Number.parseInt(row.match(/#SUP: (\d)+/g)[0].match(/(\d)+\.*(\d)*/g)[0]),
            items: row.match(/((\d)+ )*#SUP:/g)[0].match(/(\d)+\.*(\d)*/g)
        };
    }

    private _getRule( row: string ): Rule {
        return {
            support: Number.parseInt(row.match(/#SUP: (\d)+/g)[0].match(/(\d)+\.*(\d)*/g)[0]),
            confidence: Number.parseFloat(row.match(/#CONF: (\d)+\.*(\d)*/g)[0].match(/(\d)+\.*(\d)*/g)[0]),
            items: row.match(/((\d)+ )*==>/g)[0].match(/(\d)+\.*(\d)*/g),
            results: row.match(/==> ((\d)+ )*/g)[0].match(/(\d)+\.*(\d)*/g)
        };
    }

    private _getSequence( row: string ): Sequence {
        let itemSets: string[][] = row.match(/((\d+ )+-1)+/g).map( (unformatedItemSet: string) => {
            return unformatedItemSet.replace(' -1','').split(' ');
        });

        return {
            itemsets: itemSets,
            support: Number.parseInt(row.match(/#SUP: (\d)+/g)[0].match(/(\d)+\.*(\d)*/g)[0])
        };
    }

    private _getTypeOfResult( rowCell: string ): string {
        rowCell = rowCell.trim();
        if( rowCell.match(/^(\d* )+#SUP: (\d*( )*)+\t*\n*\r*$/g) ) return 'ItemSet';
        if( rowCell.match(/^(\d* )+==> (\d* )+#SUP: (\d* )+#CONF: (\d*)+\.*\d*\t*\n*\r*$/g) ) return 'Rule';
        if( rowCell.match(/((\d+ )+-1 )+#SUP: \d+/g) ) return 'Sequence';
        return null;
    }
}
