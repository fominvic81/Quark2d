import { Vector } from '../../math/Vector';
import { Pair } from './Pair';

export class Contact {
    vertex: Vector = new Vector();
    normalImpulse: number = 0;
    tangentImpulse: number = 0;
    offsetA: Vector = new Vector();
    offsetB: Vector = new Vector();
    relativeVelocity: Vector = new Vector();
    normalVelocity: number = 0;
    tangentShare: number = 0;
    normalShare: number = 0;
    bias: number = 0;
    depth: number = 0;
    positionBias: number = 0;
    positionImpulse: number = 0;
    pair: Pair;

    constructor (pair: Pair) {
        this.pair = pair;
    }
}