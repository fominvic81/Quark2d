import { Vector } from './Vector';


export class Bounds {
    min: Vector;
    max: Vector;

    static temp: Array<Bounds> = [
        new Bounds(),
    ];

    constructor () {
        this.min = new Vector();
        this.max = new Vector();
    }

    clone (output: Bounds = new Bounds()): Bounds {

        output.min.x = this.min.x;
        output.min.y = this.min.y;
        output.max.x = this.max.x;
        output.max.y = this.max.y;

        return output;
    }

    fromVertices (vertices: any /** TODO-types */): Bounds {
        this.min.x = Infinity;
        this.min.y = Infinity;
        this.max.x = -Infinity;
        this.max.y = -Infinity;

        for (const vertex of vertices) {
            if (vertex.x > this.max.x) this.max.x = vertex.x;
            if (vertex.x < this.min.x) this.min.x = vertex.x;
            if (vertex.y > this.max.y) this.max.y = vertex.y;
            if (vertex.y < this.min.y) this.min.y = vertex.y;
        }
        return this;
    }

    set (min: Vector, max: Vector) {
        min.clone(this.min);
        max.clone(this.max);
    }

    translate (vector: Vector) {
        Vector.add(this.min, vector);
        Vector.add(this.max, vector);
    }

    contains (point: Vector): boolean {
        return point.x >= this.min.x && point.x <= this.max.x &&
               point.y >= this.min.y && point.y <= this.max.y;
    }

    overlaps (boundsB: Bounds): boolean {
        return this.min.x <= boundsB.max.x && this.max.x >= boundsB.min.x &&
               this.max.y >= boundsB.min.y && this.min.y <= boundsB.max.y;
    }

    getWidth (): number {
        return this.max.x - this.min.x;
    }

    getHeight (): number {
        return this.max.y - this.min.y;
    }
};