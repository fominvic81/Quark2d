import { Vector } from './Vector';

/**
 * The 'AABB' is the class for manipulating AABBs(axis-aligned bounding boxes)
 */

export class AABB {
    min: Vector = new Vector();
    max: Vector = new Vector();

    static temp: AABB[] = [
        new AABB(),
    ];

    /**
     * Returns a new aabb copied from 'this'.
     * @param output [output]
     * @returns A clonned aabb
     */
    clone (output: AABB = new AABB()): AABB {

        output.min.x = this.min.x;
        output.min.y = this.min.y;
        output.max.x = this.max.x;
        output.max.y = this.max.y;

        return output;
    }

    /**
     * Computes the aabb of the given set of vertices.
     * @param vertices 
     * @returns The aabb
     */
    fromVertices (vertices: Vector[]): AABB {
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
     * Sets the 'min' and 'max' to the given.
     * @param min
     * @param max
     * @returns The aabb
     */
    set (min: Vector, max: Vector) {
        min.clone(this.min);
        max.clone(this.max);
        return this;
    }

    /**
     * Sets the coords of the aabb to the given.
     * @param minX
     * @param minY
     * @param maxX
     * @param maxY
     * @returns The aabb
     */
    setNum (minX: number, minY: number, maxX: number, maxY: number) {
        this.min.x = minX;
        this.min.y = minY;
        this.max.x = maxX;
        this.max.y = maxY;
        return this;
    }

    /**
     * Translates the aabb by the given vector
     * @param vector
     */
    translate (vector: Vector) {
        this.min.add(vector);
        this.max.add(vector);
    }

    /**
     * Returns true if the aabb contains the given point, otherwise false.
     * @param point
     * @returns True if the aabb contains the given point, otherwise false
     */
    contains (point: Vector): boolean {
        return point.x >= this.min.x && point.x <= this.max.x &&
               point.y >= this.min.y && point.y <= this.max.y;
    }

    /**
     * Returns true if the aabb intersects with the given one, otherwise false.
     * @param aabbB 
     * @returns True if the aabb intersects with the given one, otherwise false
     */
    overlaps (aabbB: AABB): boolean {
        return this.min.x <= aabbB.max.x && this.max.x >= aabbB.min.x &&
               this.max.y >= aabbB.min.y && this.min.y <= aabbB.max.y;
    }

    /**
     * Returns the width of the aabb.
     * @returns The width of the aabb
     */
    getWidth (): number {
        return this.max.x - this.min.x;
    }

    /**
     * Returns the height of the aabb.
     * @returns The height of the aabb
     */
    getHeight (): number {
        return this.max.y - this.min.y;
    }
};