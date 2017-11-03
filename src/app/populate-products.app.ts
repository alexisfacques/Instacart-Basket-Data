import * as RxNode from 'rx-node';
import * as fs from 'fs';

import { CSVParser } from '../class/csv-parser.class';
import { Aisle } from '../interface/aisle.interface';
import { Department } from '../interface/department.interface';

import { Product, PopulatedProduct } from '../interface/product.interface';

export class PopulateProducts {
    private readonly __foldername: string = 'instacart_basket_data';
    private _output: string[] = [];

    private _aisles: Aisle[];
    private _departments: Department[];

    constructor() {
        new CSVParser<Aisle>(`${__dirname}/../${this.__foldername}/aisles.csv`).loadAll()
            .then( (aisles: Aisle[]) => {
                this._aisles = aisles;
                console.log('Finished loading Aisles');
                return new CSVParser<Department>(`${__dirname}/../${this.__foldername}/departments.csv`).loadAll()
            })
            .then ( (departments: Department[]) => {
                this._departments = departments;
                console.log('Finished loading Departments');

                return new CSVParser<Product>(`${__dirname}/../${this.__foldername}/products.csv`).loadAll()
            })
            .then( (products: Product[]) => {
                let ret: PopulatedProduct[] = products.map( (product: Product) => {
                    return {
                        product_id: product.product_id,
                        product_name: product.product_name,
                        aisle: this._join<Aisle>(this._aisles, 'aisle_id', product.aisle_id, 'aisle'),
                        department: this._join<Department>(this._departments, 'department_id', product.department_id, 'department')
                    }
                });
            })
    }

    /**
     * Function finds element of array of which the key corresponds to value; and returns with another defined value of this element.
     */
    private _join<T>( array: T[], initKey: keyof T, value: any, returnKey?: keyof T): any {
        let element: T = array.find((element: T) => element[initKey] == value )
        if(!element) return;

        if(returnKey) return element[returnKey];
        return element;
    }
}
