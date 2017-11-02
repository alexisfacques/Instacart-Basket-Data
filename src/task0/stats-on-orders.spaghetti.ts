import { ProductOrder } from '../interface/product-order.interface';
import { Group } from '../interface/group.interface';

import * as fs from 'fs';
import{ Parser } from 'csv-parse';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/finally';
import 'rxjs/add/operator/groupBy';
import 'rxjs/add/observable/forkJoin';
import * as RxNode from 'rx-node';

/**
 * Folder in which the dataset files are.
 */
const __foldername: string = 'instacart_basket_data';

/**
 * Function returns an Observable of `ProductOrder` group by a defined criterion. You may map the parsed `ProductOrder` to whatever value you want.
 */
function _readAndGroupBy<T>( key: keyof ProductOrder, map: (val: ProductOrder) => T ): Rx.Observable<Group<ProductOrder,T>> {
    /**
     * 'csv-parse' Parser, columns options groups each row by column in an object.
     */
    let parser: Parser = new Parser({
        delimiter: ',',
        columns: true
    });

    // Turning native stream into Observable
    return RxNode.fromStream( fs.createReadStream(`${__dirname}/../${__foldername}/order_products__train.csv`).pipe(parser) )
        // Grouping objects by order
        .groupBy( (data: ProductOrder) => data[key] )
        // At this point, we basically have an Observable by group. Thus we need to flatten that.
        .flatMap( (group: Rx.GroupedObservable<string, ProductOrder>) => {
            return group
                // Formatting the data
                .map(map)
                // And flattening the Observable array.
                .reduce( (concat: Group<ProductOrder,T>, current: T) => {
                    concat.items.push(current);
                    return concat;
                }, {
                    id: group.key,
                    items: []
                })
        });
}


function statsOnOrders(): void {
    /**
     * All the groups.
     */
    let groups: Array<Group<ProductOrder,string>> = [];

    /**
     * Output file formatting, as such [order_id: number],[number_of_product: number]
     */
    let output: Array<string> = [];

    let stats: any = {
        max: 0,
        min: Infinity,
        sum: 0
    }

    /**
     * Reads the file and groups `ProductOrders as intended`
     */

    _readAndGroupBy<string>('order_id', (productOrder: ProductOrder) => productOrder.product_id )
        // Once all groups are loaded, displaying them.
        .finally( () => {
            console.log(`Maximum number of ProductOrders: ${stats.max}`);
            console.log(`Minimum number of ProductOrders: ${stats.min}`);
            console.log(`Average number of ProductOrders: ${stats.sum / groups.length}`);
            console.log(`Total number of ProductOrders: ${stats.sum}`);
            console.log(`Number of itemsets: ${groups.length}`);

            // Writing number of product per order_id in a new file.
            fs.writeFile(`${__dirname}/../${__foldername}/order_id__product_number.csv`, output.join('\r\n'), (err: any) => {
                if(err) return console.log(err);
                console.log('The file was saved!');
            });

        })
        // Note that this behaviour (induced by the flatMap of readAndGroupBy) makes everything pretty much blocking again.
        .subscribe( (group: Group<ProductOrder,string>) => {
            // Computing some basic stats on the fly
            stats.max = Math.max(group.items.length, stats.max);
            stats.min = Math.min(group.items.length, stats.min);
            stats.sum += group.items.length;

            // Pushing group to groups.
            groups.push(group);

            // Pushing order_id and its number of products to another array
            output.push(`${Number.parseInt(group.id)},${group.items.length}`);
        });
}
