import * as RxNode from 'rx-node';
import * as fs from 'fs';

import { CSVParser } from './class/csv-parser.class';
import { Group } from './interface/group.interface';
import { Product } from './interface/product.interface';
import { ProductOrder } from './interface/product-order.interface';

import { Observable } from 'rxjs/Observable'
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/finally';


export class FormatData {
    private readonly __foldername: string = 'instacart_basket_data';
    private _output: string[] = [];

    constructor() {
        new CSVParser<Product>(`${__dirname}/../${this.__foldername}/products.csv`).loadAll()
            .then( (products: Product[]) => {
                console.log('Products has been loaded');

                new CSVParser<ProductOrder>(`${__dirname}/../${this.__foldername}/order_products__train.csv`)
                    // Grouping items by order_id, and mapping every item composing these itemsets to their product_id.
                    .generateItemsets<string>('order_id', (productOrder: ProductOrder) => productOrder.product_id)
                    // Once execution is complete, writing the formatted dataset into a proper file.
                    .finally( () => {
                        // Writing number of product per order_id in a new file : The array of already formatted rows is joined by a return carriage character.
                        fs.writeFile(`/Users/alexisfacques/Projects/python-apriori/formatted_itemsets.csv`, this._output.join('\r\n'), (err: any) => {
                            if(err) return console.log(err);
                            console.log('The file was saved!');
                        });
                    })
                    // On group reception, formatting the items composing is as a ROW (joined by plain space character), and pushing it the output array.
                    .subscribe((group: Group<ProductOrder,string>) => this._output.push(group.items.join(' ')) )
            })
    }
}

new FormatData();
