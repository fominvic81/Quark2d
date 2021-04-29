import { Vector } from './Vector';

/**
 * The 'AABB' is the class for manipulating AABBs(axis-aligned bounding boxes)
 */

export class AABB {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;

    constructor (minX: number = 0, minY: number = 0, maxX: number = 0, maxY: number = 0) {
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
    }

    static temp: AABB[] = [
        new AABB(),
    ];

    /**
     * Returns a new aabb copied from 'this'.
     * @param output [output]
     * @returns A clonned aabb
     */
    clone (output: AABB = new AABB()): AABB {

        output.minX = this.minX;
        output.minY = this.minY;
        output.maxX = this.maxX;
        output.maxY = this.maxY;

        return output;
    }

    /**
     * Computes the aabb of the given set of vertices.
     * @param vertices 
     * @returns The aabb
     */
    fromVertices (vertices: Vector[]): AABB {
        this.minX = Infinity;
        this.minY = Infinity;
        this.maxX = -Infinity;
        this.maxY = -Infinity;

        for (const vertex of vertices) {
            if (vertex.x > this.maxX) this.maxX = vertex.x;
            if (vertex.x < this.minX) this.minX = vertex.x;
            if (vertex.y > this.maxY) this.maxY = vertex.y;
            if (vertex.y < this.minY) this.minY = vertex.y;
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
        this.minX = min.x;
        this.minY = min.y;
        this.maxX = max.x;
        this.maxY = max.y;
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
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
        return this;
    }

    /**
     * Translates the aabb by the given vector
     * @param vector
     */
    translate (vector: Vector) {
        this.minX += vector.x;
        this.minY += vector.y;
        this.maxX += vector.x;
        this.maxY += vector.y;
    }

    /**
     * Returns true if the aabb contains the given point, otherwise false.
     * @param point
     * @returns True if the aabb contains the given point, otherwise false
     */
    contains (point: Vector): boolean {
        return point.x >= this.minX && point.x <= this.maxX &&
               point.y >= this.minY && point.y <= this.maxY;
    }

    /**
     * Returns true if the aabb intersects with the given one, otherwise false.
     * @param aabbB 
     * @returns True if the aabb intersects with the given one, otherwise false
     */
    overlaps (aabbB: AABB): boolean {
        return this.minX <= aabbB.maxX && this.maxX >= aabbB.minX &&
               this.maxY >= aabbB.minY && this.minY <= aabbB.maxY;
    }

    /**
     * Returns the width of the aabb.
     * @returns The width of the aabb
     */
    getWidth (): number {
        return this.maxX - this.minX;
    }

    /**
     * Returns the height of the aabb.
     * @returns The height of the aabb
     */
    getHeight (): number {
        return this.maxY - this.minY;
    }
};