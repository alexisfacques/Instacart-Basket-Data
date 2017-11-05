import * as RxNode from 'rx-node';
import * as fs from 'fs';

import { CSVParser } from './class/csv-parser.class';
import { SPMF, SPMFResults, ItemSet, Rule, Sequence } from './class/spmf.class';

import { Group } from './interface/group.interface';
import { Product } from './interface/product.interface';
import { ProductOrder } from './interface/product-order.interface';

import { FilterAisle } from './app/filter-aisle.app';

import { Observable } from 'rxjs/Observable'
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/finally';

import { Parser, Options } from 'csv-parse';
import { ChordSerie } from './class/chord-serie.class';


new SPMF('LCM')
      // Loading from file
      .fromFile(`/Users/alexisfacques/Projects/Instacart-Basket-Data/custom_data/formatted_itemsets.txt`)
      // Executes LCM with .1% support
      .exec<Rule>(.1)
      // Listening for results
      .subscribe((results: SPMFResults<Rule>) => {
      });
