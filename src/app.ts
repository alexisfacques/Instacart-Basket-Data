import * as RxNode from 'rx-node';
import * as fs from 'fs';

import { CSVParser } from './class/csv-parser.class';
import { SPMF, SPMFResults, ItemSet, Rule } from './class/spmf.class';

import { Group } from './interface/group.interface';
import { Product } from './interface/product.interface';
import { ProductOrder } from './interface/product-order.interface';

import { FilterAisle } from './app/filter-aisle.app';

import { Observable } from 'rxjs/Observable'
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/finally';

new SPMF('FPGrowth_association_rules')
    .fromFile(`/Users/alexisfacques/Projects/python-apriori/formatted_itemsets.csv`)
    .exec(0.1,25)
    .subscribe((results: SPMFResults) => {
        console.log(results.stats);
        console.log(results.itemsets.length);

        let rules: Rule[] = <Rule[]> results.itemsets;
        rules = rules.filter((rule: Rule) => rule.items.length > 1 );

        console.log(rules);
    });
