export class ChordSerie {
    private _relationCount: number[] = [];

    constructor( public itemId: string ){}

    public setSeriesNumber( value: number ): ChordSerie {
        // This create 0-filled array of size 'value'.
        this._relationCount = Array.apply(null, Array(value)).map(Number.prototype.valueOf,0);
        return this;
    }

    public addRelation( weight: number, seriesId: number[] ): ChordSerie {
        seriesId.forEach( (id: number) => this._relationCount[id] += weight );
        return this;
    }

    public getValues(): number[] {
        return this._relationCount;
    }

    public getSerie( nameMap?: (val: string) => string ): { text: string, values: number[] } {
        let name: string = this.itemId;
        if(nameMap) name = nameMap(name);

        return {
            text: name,
            values: this.getValues()
        };
    }
}
