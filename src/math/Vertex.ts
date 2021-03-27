import { Vector } from './Vector';

export class Vertex extends Vector {
    index: number;

    constructor (x: number, y: number, index: number) {
        super(x, y);
        this.index = index;
    }

}