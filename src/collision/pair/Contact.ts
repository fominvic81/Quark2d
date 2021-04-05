import { Vector } from '../../math/Vector';
import { Pair } from './Pair';

export class Contact {
    vertex: Vector = new Vector();
    normalImpulse: number = 0;
    tangentImpulse: number = 0;
    offsetA: Vector = new Vector();
    offsetB: Vector = new Vector();
    tangentShare: number = 0;
    normalShare: number = 0;
    pair: Pair;

    constructor (pair: Pair) {
        this.pair = pair;
    }
}