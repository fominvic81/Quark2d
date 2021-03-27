
/**
 * asdsdasd
 */

export const Common = new class {
    IDs: Map<string, number>;
    PI05: number;
    PI: number;
    PI2: number;
    PI3: number;

    constructor () {
        this.IDs = new Map();
        this.PI05 = Math.PI * 0.5;
        this.PI = Math.PI;
        this.PI2 = Math.PI * 2;
        this.PI3 = Math.PI * 3;
    }

    sign (n: number): number {
        return n >= 0 ? 1 : -1;
    }

    nextId (name: string = 'id'): number {
        const id = this.IDs.get(name);
        if (this.IDs.get(name) === undefined) {
            this.IDs.set(name, 0);
            return 0;
        }

        this.IDs.set(name, <number>id + 1);

        return <number>id + 1;
    }

    combineId (idA: number, idB: number): number {
        if (idA < idB) {
            return (idA << 20) + idB;
        }
        return (idB << 20) + idA;
    }
    clamp (value: number, min: number, max: number): number {
        if (min > value) {
            return min;
        }
        if (max < value) {
            return max;
        }
        return value;
    }

    contains (value: number, min: number, max: number): boolean {
        return !(min > value || max < value);
    }

    normaliseAngle (angle: number): number {
        return (((angle % this.PI2) + this.PI3) % this.PI2 - this.PI);
    }

    angleDiff (angleA: number, angleB: number): number {
        return this.normaliseAngle(angleA - angleB);
    }
    clampAngle (angle: number, minAngle: number, maxAngle: number): number {
        if (Math.abs(maxAngle - minAngle) < 0.001) return maxAngle;

        const minDiff = this.angleDiff(angle, minAngle);
        const maxDiff = this.angleDiff(angle, maxAngle);

        if (minDiff > 0 && maxDiff < 0) return angle;
        if (Math.abs(maxDiff) > Math.abs(minDiff)) return angle - minDiff;
        return angle - maxDiff;
    };
}