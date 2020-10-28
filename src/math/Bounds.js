import { Vector } from './Vector';


export class Bounds {

    constructor () {
        
        this.min = new Vector();
        this.max = new Vector();

    }

    clone (output) {
        if (!output) {
            output = new Bounds();
        }

        output.min.x = this.min.x;
        output.min.y = this.min.y;
        output.max.x = this.max.x;
        output.max.y = this.max.y;

        return output;
    }

    fromVertices (vertices) {
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

    set (min, max) {
        this.min = min;
        this.max = max;
    }

    translate (vector) {
        Vector.add(this.min, vector);
        Vector.add(this.max, vector);
    }

    contains (point) {
        return point.x >= this.min.x && point.x <= this.max.x &&
               point.y >= this.min.y && point.y <= this.max.y;
    }

    overlaps (boundsB) {
        return this.min.x <= boundsB.max.x && this.max.x >= boundsB.min.x &&
        this.max.y >= boundsB.min.y && this.min.y <= boundsB.max.y;
    }

    getWidth () {
        return this.max.x - this.min.x;
    }

    getHeight () {
        return this.max.y - this.min.y;
    }

    static combine(boundsList, output = undefined) {
        if (boundsList.length === 0) return;
        if (!output) {
            output = new Bounds();
        }
        output.min.x = Infinity;
        output.min.y = Infinity;
        output.max.x = -Infinity;
        output.max.y = -Infinity;
        for (const bounds of boundsList) {
            output.min.x = Math.min(output.min.x, bounds.min.x);
            output.min.y = Math.min(output.min.y, bounds.min.y);
            output.max.x = Math.max(output.max.x, bounds.max.x);
            output.max.y = Math.max(output.max.y, bounds.max.y);
        }
        return output;
    }

};

Bounds.temp = [
    new Bounds(),
];