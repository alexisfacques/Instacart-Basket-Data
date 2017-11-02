import { ProductOrder } from '../interface/product-order.interface';
import { Group } from '../interface/group.interface';
import { Product } from '../interface/product.interface';

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


let products: Array<Product> = [];

readFile<Product>(`${__dirname}/../${__foldername}/products.csv`)
    .then( (products: Product[]) => {
        console.log('Finished loading products');
        statsOnProducts(products);
    })





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

/**
 * Function reads a .csv file and returns it properlly formatted.
 */
function readFile<T>( filePath: string ): Promise<Array<T>> {
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

function statsOnProducts( products: Product[] ): void {
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

    let product: any = {
        best: [],
        worst: []
    }

    /**
     * Reads the file and groups `ProductOrders as intended`
     */

    _readAndGroupBy<string>('product_id', (productOrder: ProductOrder) => productOrder.product_id )
        // Once all groups are loaded, displaying them.
        .finally( () => {
            console.log(`Maximum number of ProductOrders: ${stats.max}`);
            console.log(`Minimum number of ProductOrders: ${stats.min}`);
            console.log(`Average number of ProductOrders: ${stats.sum / groups.length}`);
            console.log(`Total number of ProductOrders: ${stats.sum}`);
            console.log(`Number of itemsets: ${groups.length}`);

            console.log(`Most popular products: ${product.best}`);
            console.log(`Least popular products: ${product.worst},${product.worst.length}`);


            // Writing number of product per order_id in a new file.
            fs.writeFile(`${__dirname}/../${__foldername}/product_id__order_number.csv`, output.join('\r\n'), (err: any) => {
                if(err) return console.log(err);
                console.log('The file was saved!');
            });

        })
        // Note that this behaviour (induced by the flatMap of readAndGroupBy) makes everything pretty much blocking again.
        .subscribe( (group: Group<ProductOrder,string>) => {
            group.id = join<Product>(products,'product_id',group.id,'product_name');

            if(group.items.length == stats.max) product.best.push(group.id);
            else if(group.items.length > stats.max) product.best = [group.id];

            if(group.items.length == stats.min) product.worst.push(group.id);
            else if(group.items.length < stats.max) product.worst = [group.id];

            // Computing some basic stats on the fly
            stats.max = Math.max(group.items.length, stats.max);
            stats.min = Math.min(group.items.length, stats.min);
            stats.sum += group.items.length;

            // Pushing group to groups.
            groups.push(group);

            // Pushing order_id and its number of products to another array
            output.push(`${group.id},${group.items.length}`);
        });
}

/**
 * Function finds element of array of which the key corresponds to value; and returns with another defined value of this element.
 */
function join<T>( array: T[], initKey: keyof T, value: any, returnKey: keyof T): any {
    let element: T = array.find((element: T) => element[initKey] == value )
    return element[returnKey];
}
