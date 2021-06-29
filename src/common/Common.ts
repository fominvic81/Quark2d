
/**
 * The 'Common' is an object that contains simple methods.
 */

export class Common {
    static IDs: Map<string, number> = new Map();
    static PI05: number = Math.PI * 0.5;
    static PI: number = Math.PI;
    static PI2: number = Math.PI * 2;
    static PI3: number = Math.PI * 3;

    /**
     * Returns the sign of the given number.
     * @param n
     * @returns The sign of 'n'
     */
    static sign (n: number): number {
        return n < 0 ? -1 : 1;
    }

    /**
     * Returns the unique next id.
     * @param name The name of group of id
     * @returns The next id
     */
    static nextId (name: string = 'id'): number {
        const id = this.IDs.get(name);
        if (this.IDs.get(name) === undefined) {
            this.IDs.set(name, 0);
            return 0;
        }

        this.IDs.set(name, <number>id + 1);

        return <number>id + 1;
    }

    /**
     * Combines the given ids.
     * @param idA
     * @param idB
     * @returns Combined id
     */
    static combineId (idA: number, idB: number): number {
        if (idA < idB) {
            return (idA << 16) + idB;
        }
        return (idB << 16) + idA;
    }

    /**
     * Clamps the given value between 'min' and 'max'
     * @param value 
     * @param min 
     * @param max 
     * @returns 
     */
    static clamp (value: number, min: number, max: number): number {
        if (min > value) {
            return min;
        }
        if (max < value) {
            return max;
        }
        return value;
    }

    /**
     * Normalises the given angle (in radians).
     * @param angle
     * @returns The normalised angle
     */
    static normaliseAngle (angle: number): number {
        return (((angle % this.PI2) + this.PI3) % this.PI2 - this.PI);
    }

    /**
     * Returns the normalised difference between the two angles(in radians).
     * @param angleA
     * @param angleB
     * @returns The normalised difference
     */
    static angleDiff (angleA: number, angleB: number): number {
        return this.normaliseAngle(angleA - angleB);
    }

    /**
     * Clamps the given 'angle' between 'minAngle' and 'maxAngle'(in radians).
     * @param angle
     * @param minAngle
     * @param maxAngle
     * @returns The clamped angle
     */
    static clampAngle (angle: number, minAngle: number, maxAngle: number): number {
        if (Math.abs(maxAngle - minAngle) < 0.001) return maxAngle;

        const minDiff = this.angleDiff(angle, minAngle);
        const maxDiff = this.angleDiff(angle, maxAngle);

        if (minDiff > 0 && maxDiff < 0) return angle;
        if (Math.abs(maxDiff) > Math.abs(minDiff)) return angle - minDiff;
        return angle - maxDiff;
    }
}