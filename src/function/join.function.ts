export function join<T>( array: T[], initKey: keyof T, value: any, returnKey: keyof T): any {
    let element: T = array.find((element: T) => element[initKey] == value );
    return element[returnKey];
}
