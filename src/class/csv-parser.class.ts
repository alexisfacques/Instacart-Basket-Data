import * as fs from 'fs';
import{ Parser, Options } from 'csv-parse';

import { Group } from '../interface/group.interface';

import * as RxNode from 'rx-node';

import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/groupBy';

export class CSVParser<T> {
    private _parser: Parser;

    constructor( private inputFile: string, private _parserOptions: Options = {
        delimiter: ',',
        columns: true
    }) { this._parser = new Parser(this._parserOptions) }

    /**
     * Function reads a .csv file and returns it properlly formatted.
     */
    public loadAll(): Promise<T[]>  {

        return new Promise( (resolve, reject) => {
            let ret: Array<T> = [];

            this._parser
                .on('data', (data: T) => ret.push(data) )
                .on('error', (error: any) => reject(error) )
                .on('end', () => resolve(ret) );

            // Reading the file and piping to parser
            fs.createReadStream(this.inputFile).pipe(this._parser);
        });
    }

    /**
     * Function returns an Observable of parsed data, grouped by any of its key.
     */
    public generateItemsets<U>( key: keyof T, map: (val: T) => U, filter?: (val: T) => boolean ): Rx.Observable<Group<T,U>> {
        // Turning native stream into Observable
        return RxNode.fromStream( fs.createReadStream(this.inputFile).pipe(this._parser) )
            // Grouping objects by order
            .groupBy( (data: T) => data[key] )
            // At this point, we basically have an Observable by group. Thus we need to flatten that.
            .flatMap( (group: Rx.GroupedObservable<T[keyof T], T>) => {
                let ret: Rx.Observable<any> = group;
                // Filtering the data
                if(filter) ret = group.filter(filter);

                return ret
                    // Formatting the data
                    .map(map)
                    // And flattening the Observable array.
                    .reduce( (concat: Group<T,U>, current: U) => {
                        concat.items.push(current);
                        return concat;
                    }, {
                        id: group.key,
                        items: []
                    })
            });
    }
}
