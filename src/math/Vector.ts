import { Common } from '../common/Common';

/**
 * The Vector is class that provides methods for manipulating vectors.
 */
export class Vector {
    x: number;
    y: number;

    /**
     * Creates a new Vector.
     * @param x
     * @param y
     */
    constructor (x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * Returns a new vector copied from 'this'.
     * If the output isn't undefined copy 'x' and 'y' from 'this' to the output.
     * @param output [output]
     * @returns A clonned vector
     */
    clone (output: Vector | undefined = undefined): Vector {
        if (output) {
            output.x = this.x;
            output.y = this.y;
            return output;
        }
        return new Vector(this.x, this.y);
    }

    /**
     * Sets the coordinates of a vector to the given values.
     * @param x
     * @param y
     * @returns The vector
     */
    set (x: number, y: number): Vector {
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * Rotates the vector by the given angle.
     * If the output isn`t undefined doesn't changes the vector and copies 'x' and 'y' to the output.
     * @param angle
     * @param output [output]
     * @returns A rotated vector
     */
    rotate (angle: number, output: Vector = this): Vector {
        const cos: number = Math.cos(angle);
        const sin: number = Math.sin(angle);
        const x: number = this.x;
        const y: number = this.y;
        output.x = x * cos - y * sin;
        output.y = x * sin + y * cos;
        return output;
    }

    /**
     * Negates the vector.
     * If the output isn`t undefined doesn't changes the vector and copies 'x' and 'y' to the output.
     * @param output [output]
     * @returns A negated vector
     */
    neg (output: Vector = this): Vector {
        output.x = -this.x;
        output.y = -this.y;
        return output;
    }

    /**
     * Rotates the vector by 90 degrees.
     * If the output isn`t undefined doesn't changes the vector and copies 'x' and 'y' to the output.
     * @param output [output]
     * @returns The rotated vector
     */
    rotate90 (output: Vector = this): Vector {
        const x: number = this.x;
        output.x = -this.y;
        output.y = x;
        return output;
    }

    /**
     * Rotates the vector by 270 degrees.
     * If the output isn`t undefined doesn't changes the vector and copies 'x' and 'y' to the output.
     * @param output [output]
     * @returns The rotated vector
     */
    rotate270 (output: Vector = this): Vector {
        const x = this.x;
        output.x = this.y;
        output.y = -x;
        return output;
    }

    /**
     * Returns the length of the vector.
     * @returns The length of the vector
     */
    length (): number {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }

    /**
     * Returns the squared length of the vector.
     * @returns The squared length of the vector
     */
    lengthSquared (): number {
        return Math.pow(this.x, 2) + Math.pow(this.y, 2);
    }

    /**
     * Normalises the vector.
     * If the output isn`t undefined doesn't changes the vector and copies 'x' and 'y' to the output.
     * @param output [output]
     * @returns The normalised vector
     */
    normalise (output: Vector = this): Vector {
        const length: number = this.length();
        output.x = this.x / length;
        output.y = this.y / length;
        return output;
    }

    /**
     * Scales the vector by the given scalar.
     * If the output isn`t undefined doesn't changes the vector and copies 'x' and 'y' to the output.
     * @param s The scalar
     * @param output [output]
     * @returns The scaled vector
     */
    scale (s: number, output: Vector = this): Vector {
        output.x = this.x * s;
        output.y = this.y * s;
        return output;
    }

    /**
     * Divides the vector by the given divisor.
     * If the output isn`t undefined doesn't changes the vector and copies 'x' and 'y' to the output.
     * @param s The divisor
     * @param output [output]
     * @returns The divided vector
     */
    divide (s: number, output: Vector = this): Vector {
        output.x = this.x / s;
        output.y = this.y / s;
        return output;
    }

    /**
     * Adds two vectors.
     * @param vector
     * @returns Sum of the two vectors
     */
    add (vector: Vector): Vector {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }

    /**
     * Subtracts two vectors.
     * @param vector
     * @returns Difference of two vectors
     */
    subtract (vector: Vector): Vector {
        this.x -= vector.x;
        this.y -= vector.y;
        return this;
    }

    /**
     * Returns the angle between two vectors.
     * If vectorB is undefined than returns the angle between vectorA and 'x' axis.
     * @param vectorA
     * @param vectorB
     * @returns The angle
     */
    static angle (vectorA: Vector, vectorB: Vector | undefined = undefined): number {
        if (vectorB) {
            return Math.atan2(vectorB.y - vectorA.y, vectorB.x - vectorA.x);
        } else {
            return Math.atan2(vectorA.y, vectorA.x);
        }
    }

    /**
     * Returns the distance between two vectors.
     * @param vectorA
     * @param vectorB
     * @returns The distance between two vectors
     */
    static dist (vectorA: Vector, vectorB: Vector): number {
        return Math.sqrt(Math.pow((vectorA.x - vectorB.x), 2) + Math.pow((vectorA.y - vectorB.y), 2));
    }

    /**
     * Returns the squared distance between two vectors.
     * @param vectorA
     * @param vectorB
     * @returns The squared distance between two vectors
     */
    static distSquared (vectorA: Vector, vectorB: Vector): number {
        return Math.pow((vectorA.x - vectorB.x), 2) + Math.pow((vectorA.y - vectorB.y), 2);
    }

    /**
     * Returns the dot product of two vectors.
     * @param vectorA
     * @param vectorB
     * @returns The dot product of two vectors
     */
    static dot (vectorA: Vector, vectorB: Vector): number {
        return (vectorA.x * vectorB.x) + (vectorA.y * vectorB.y);
    }

    /**
     * Returns the cross product of two vectors.
     * @param vectorA
     * @param vectorB
     * @returns The cross product of two vectors
     */
    static cross (vectorA : Vector, vectorB: Vector): number {
        return (vectorA.x * vectorB.y) - (vectorA.y * vectorB.x);
    }

    /**
     * Adds two vectors.
     * @param vectorA
     * @param vectorB
     * @param output [output]
     * @returns Sum of two vectors
     */
    static add (vectorA: Vector, vectorB: Vector, output: Vector): Vector {
        output.x = vectorA.x + vectorB.x;
        output.y = vectorA.y + vectorB.y;
        return output;
    }

    /**
     * Subtracts two vectors.
     * @param vectorA
     * @param vectorB
     * @param output [output]
     * @returns Difference of two vectors
     */
    static subtract (vectorA: Vector, vectorB: Vector, output: Vector): Vector {
        output.x = vectorA.x - vectorB.x;
        output.y = vectorA.y - vectorB.y;
        return output;
    }

    /**
     * Multiplies two vectors.
     * @param vectorA
     * @param vectorB
     * @param output [output]
     * @returns Multiplied vector
     */
    static mult (vectorA: Vector, vectorB: Vector, output: Vector = vectorA): Vector {
        output.x = vectorA.x * vectorB.x;
        output.y = vectorA.y * vectorB.y;
        return output;
    }

    /**
     * Returns true if two vectors are collinear or false if not.
     * @param vectorA
     * @param vectorB
     * @returns True if two vectors are collinear or false if not
     */
    static isCollinear (vectorA: Vector, vectorB: Vector): boolean {
        return (Math.abs(vectorA.x / vectorA.y - vectorB.x / vectorB.y) < 0.0001) || (vectorA.y === 0 && vectorB.y === 0);
    }

    /**
     * Interpolates two vectors('t' is from 0 to 1).
     * @param vectorA
     * @param vectorB
     * @param t
     * @param output [output]
     * @returns The interpolated vector
     */
    static interpolate (vectorA: Vector, vectorB: Vector, t: number, output: Vector): Vector {
        output.x = vectorA.x + t * (vectorB.x - vectorA.x);
        output.y = vectorA.y + t * (vectorB.y - vectorA.y);
        return output;
    }

    /**
     * Returns the intersection point of two line segments or undefined if vectors don't intersects.
     * @param start1
     * @param end1
     * @param start2
     * @param end2
     * @param output
     * @returns The intersection point
     */
    static lineLineIntersection (start1: Vector, end1: Vector, start2: Vector, end2: Vector, output: Vector): Vector | undefined {
        const t = Vector.lineLineIntersectionFraction(start1, end1, start2, end2);
        if(t < 0){
            return;
        } else {
            output.x = start1.x + (t * (end1.x - start1.x));
            output.y = start1.y + (t * (end1.y - start1.y));
            return output;
        }
    };

    /**
     * Returns the intersection fraction between two line segments.
     * @param start1 
     * @param end1 
     * @param start2 
     * @param end2 
     * @returns The intersection fraction
     */
    static lineLineIntersectionFraction (start1: Vector, end1: Vector, start2: Vector, end2: Vector): number {
        const deltaX1 = end1.x - start1.x;
        const deltaY1 = end1.y - start1.y;
        const deltaX2 = end2.x - start2.x;
        const deltaY2 = end2.y - start2.y;

        const deltaStartX = start1.y - start2.y;
        const deltaStartY = start1.x - start2.x;
    
        const determinant = deltaX1 * deltaY2 - deltaX2 * deltaY1;
    
        let a = (deltaX1 * deltaStartX - deltaY1 * deltaStartY) / determinant;
        if (a < 0 || a > 1) return -1;
        let b = (deltaX2 * deltaStartX - deltaY2 * deltaStartY) / determinant;
        if (b < 0 || b > 1) return -1;
        return b;
    };

    /**
     * Returns t (from -1 to 1) where Vector.interpolateT is closest to zero.
     * @param vectorA
     * @param vectorB
     * @returns t
     */
    static zeroT (vectorA: Vector, vectorB: Vector): number {
        const delta = Vector.subtract(vectorB, vectorA, Vector.prTemp[0]);
        return -Common.clamp(
            Vector.dot(delta, Vector.add(vectorA, vectorB, Vector.prTemp[1])) / (delta.lengthSquared()),
            -1, 1,
        );
    }

    /**
     * Interpolates two vectors('t' is from -1 to 1).
     * @param vectorA
     * @param vectorB
     * @param t
     * @param output
     * @returns The interpolated vector
     */
    static interpolateT (vectorA: Vector, vectorB: Vector, t: number, output: Vector = new Vector()): Vector {
        const halfT: number = 0.5 * t;
        return Vector.add(
            vectorA.scale(0.5 - halfT, Vector.prTemp[0]),
            vectorB.scale(0.5 + halfT, Vector.prTemp[1]),
            output,
        );
    }

    /**
     * Returns the squared distance between line segment and zero.
     * @param vectorA
     * @param vectorB
     * @returns The squared distance
     */
    static distSquaredToZero (vectorA: Vector, vectorB: Vector): number {
        return Vector.interpolateT(vectorA, vectorB, Vector.zeroT(vectorA, vectorB), Vector.prTemp[0]).lengthSquared();
    }

    /**
     * Returns true if the 'c' is on the left side of the line segment 'a-b' or false if not.
     * @param a
     * @param b
     * @param c
     * @returns True if the 'c' is on the left side of the line segment 'a-b' or false if not
     */
    static side (a: Vector, b: Vector, c: Vector): boolean {
        return (b.y - a.y) * (a.x + b.x - 2 * c.x) > (b.x - a.x) * (a.y + b.y - 2 * c.y);
    }

    /**
     * Returns true if zero-vector is on the left side of the line segment 'a-b' or false if not.
     * @param a
     * @param b
     * @returns True if the zero-vector is on the left side of the line segment 'a-b' or false if not
     */
    static zeroSide (a: Vector, b: Vector): boolean {
        return (b.y - a.y) * (a.x + b.x) > (b.x - a.x) * (a.y + b.y);
    }

    /** 
     * Zero-vector
     */
    static readonly zero: Vector = new Vector();
    /**
     * Temporary vectors
     */
    static readonly temp: Array<Vector> = [
        new Vector(), new Vector(),
        new Vector(), new Vector(),
        new Vector(), new Vector(),
        new Vector(),
    ];

    /**
     * Private temporary vectors
     */
    private static prTemp: Array<Vector> = [new Vector(), new Vector()];
}