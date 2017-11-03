import { Aisle } from './aisle.interface';
import { Department } from './department.interface';

export interface Product {
    product_id: string,
    product_name: string,
    aisle_id: string,
    department_id:  string
}

export interface PopulatedProduct {
    product_id: string,
    product_name: string,
    aisle: string,
    department: string
}
