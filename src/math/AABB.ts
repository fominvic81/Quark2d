import { Vector } from './Vector';

const temp = new Vector();

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

    /**
     * Returns perimeter of AABB.
     * @returns Perimeter of AABB
     */
    perimeter (): number {
        return 2 * (this.maxX - this.minX + this.maxY - this.minY);
    }

    /**
     * Returns the center of aabb.
     * @param output
     * @returns The center of aabb
     */
    center (output: Vector) {
        return output.set(
            (this.minX + this.maxX) / 2,
            (this.minY + this.maxY) / 2,
        );
    }

    /**
     * Returns the intersection fraction between aabb and line segment.
     * @param start The start of line segment
     * @param delta Vector from start of line segment to end of line segment
     * @returns The intersection fraction between aabb and line segment.
     */
    raycast (start: Vector, delta: Vector) {
        let tmin = -Infinity;
        let tmax = Infinity;

        if (Math.abs(delta.x) < 0.00001) {
            if (start.x < this.minX || this.maxX < start.x) return Infinity;
        } else {
            const inv_d = 1 / delta.x;

            let t1 = (this.minX - start.x) * inv_d;
            let t2 = (this.maxX - start.x) * inv_d;

            if (t1 > t2) {
                [t1, t2] = [t2, t1];
            }

            tmin = Math.max(tmin, t1);
            tmax = Math.min(tmax, t2);

            if (tmin > tmax) return Infinity;
        }

        if (Math.abs(delta.y) < 0.00001) {
            if (start.y < this.minY || this.maxY < start.y) return Infinity;
        } else {
            const inv_d = 1 / delta.y;

            let t1 = (this.minY - start.y) * inv_d;
            let t2 = (this.maxY - start.y) * inv_d;

            if (t1 > t2) {
                [t1, t2] = [t2, t1];
            }

            tmin = Math.max(tmin, t1);
            tmax = Math.min(tmax, t2);

            if (tmin > tmax) return Infinity;
        }

        if (tmin > 1) return Infinity;
        if (tmin < 0) {
            if (this.contains(start)) return 0;
            return Infinity;
        }

        return tmin;
    }

    /**
     * Returns true if aabbA is completely inside aabbB.
     * @param aabbA
     * @param aabbB
     * @returns True if aabbA is completely inside aabbB.
     */
    static isInside (aabbA: AABB, aabbB: AABB) {
        return aabbA.minX >= aabbB.minX && aabbA.minY >= aabbB.minY  && aabbA.maxX <= aabbB.maxX && aabbA.maxY <= aabbB.maxY;
    }

    /**
     * Returns union of two aabbs.
     * @param aabbA
     * @param aabbB
     * @param output
     * @returns Union of two aabbs
     */
     static union (aabbA: AABB, aabbB: AABB, output: AABB): AABB {
        return output.setNum(
            Math.min(aabbA.minX, aabbB.minX),
            Math.min(aabbA.minY, aabbB.minY),
            Math.max(aabbA.maxX, aabbB.maxX),
            Math.max(aabbA.maxY, aabbB.maxY),
        );
    }
};