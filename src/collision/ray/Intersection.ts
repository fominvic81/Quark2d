import { Shape } from '../../body/shapes/Shape';
import { Vector } from '../../math/Vector';

export class Intersection {
    shape: Shape;
    point: Vector = new Vector();
    normal: Vector = new Vector();
    fraction: number = 0;

    constructor (shape: Shape) {
        this.shape = shape;
    }
}