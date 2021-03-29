import { Vector } from './Vector';

/**
 * The 'Bounds' is the class for manipulating AABBs(axis-aligned bounding boxes)
 */

export class Bounds {
    min: Vector = new Vector();
    max: Vector = new Vector();

    static temp: Array<Bounds> = [
        new Bounds(),
    ];

    /**
     * Returns a new bounds copied from 'this'.
     * @param output [output]
     * @returns A clonned bounds
     */
    clone (output: Bounds = new Bounds()): Bounds {

        output.min.x = this.min.x;
        output.min.y = this.min.y;
        output.max.x = this.max.x;
        output.max.y = this.max.y;

        return output;
    }

    /**
     * Computes the bounds of the given set of vertices.
     * @param vertices 
     * @returns The bounds
     */
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

    /**
     * Sets the 'min' and 'max' to the given ones.
     * @param min
     * @param max
     */
    set (min: Vector, max: Vector) {
        min.clone(this.min);
        max.clone(this.max);
    }

    /**
     * Translates the bounds by the given vector
     * @param vector
     */
    translate (vector: Vector) {
        Vector.add(this.min, vector);
        Vector.add(this.max, vector);
    }

    /**
     * Returns true if the bounds contains the given point, otherwise false.
     * @param point
     * @returns True if the bounds contains the given point, otherwise false
     */
    contains (point: Vector): boolean {
        return point.x >= this.min.x && point.x <= this.max.x &&
               point.y >= this.min.y && point.y <= this.max.y;
    }

    /**
     * Returns true if the bounds intersects with the given one, otherwise false.
     * @param boundsB 
     * @returns True if the bounds intersects with the given one, otherwise false
     */
    overlaps (boundsB: Bounds): boolean {
        return this.min.x <= boundsB.max.x && this.max.x >= boundsB.min.x &&
               this.max.y >= boundsB.min.y && this.min.y <= boundsB.max.y;
    }

    /**
     * Returns the width of the bounds.
     * @returns The width of the bounds
     */
    getWidth (): number {
        return this.max.x - this.min.x;
    }

    /**
     * Returns the height of the bounds.
     * @returns The height of the bounds
     */
    getHeight (): number {
        return this.max.y - this.min.y;
    }
};