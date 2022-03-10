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
     * @returns A copied vector
     */
    copy (): Vector {
        return new Vector(this.x, this.y);
    }

    /**
     * Copies values inside other vector.
     * @param output
     * @returns A clonned vector
     */
    clone (output: Vector): Vector {
        output.x = this.x;
        output.y = this.y;
        return output;
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
     * @param angle
     * @returns A rotated vector
     */
    rotate (angle: number): Vector {
        return this.rotateU(Math.cos(angle), Math.sin(angle));
    }

    rotateU (uX: number, uY: number): Vector {
        const x: number = this.x;
        this.x = x * uX - this.y * uY;
        this.y = x * uY + this.y * uX;
        return this;
    }

    rotateAbout (angle: number, point: Vector) {
        return this.rotateAboutU(Math.cos(angle), Math.sin(angle), point);
    }

    rotateAboutU (uX: number, uY: number, point: Vector) {
        const x = this.x - point.x;
        const y = this.y - point.y;
        this.x = x * uX - y * uY + point.x;
        this.y = x * uY + y * uX + point.y;
        return this;
    }

    /**
     * Rotates the vector by 180 degrees.
     * @returns A negated vector
     */
    neg (): Vector {
        this.x = -this.x;
        this.y = -this.y;
        return this;
    }

    /**
     * Rotates the vector by 90 degrees.
     * @returns The rotated vector
     */
    rotate90 (): Vector {
        const x: number = this.x;
        this.x = -this.y;
        this.y = x;
        return this;
    }
    /**
     * Rotates the vector by 270 degrees.
     * @returns The rotated vector
     */
    rotate270 (): Vector {
        const x = this.x;
        this.x = this.y;
        this.y = -x;
        return this;
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
     * @returns The normalised vector
     */
    normalise (): Vector {
        const length: number = this.length();
        this.x /= length;
        this.y /= length;
        return this;
    }

    /**
     * Scales the vector by the given scalar.
     * @param scalar The scalar
     * @returns The scaled vector
     */
    scale (scalar: number): Vector {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    /**
     * Divides the vector by the given divisor.
     * @param divisor The divisor
     * @returns The divided vector
     */
    divide (divisor: number): Vector {
        this.x /= divisor;
        this.y /= divisor;
        return this;
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
     * @param output
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
     * @param output
     * @returns Difference of two vectors
     */
    static subtract (vectorA: Vector, vectorB: Vector, output: Vector): Vector {
        output.x = vectorA.x - vectorB.x;
        output.y = vectorA.y - vectorB.y;
        return output;
    }

    /**
     * Interpolates two vectors('t' is from 0 to 1).
     * @param vectorA
     * @param vectorB
     * @param t
     * @param output
     * @returns The interpolated vector
     */
    static lerp (vectorA: Vector, vectorB: Vector, t: number, output: Vector): Vector {
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
    static lineSegmentsIntersection (start1: Vector, end1: Vector, start2: Vector, end2: Vector, output: Vector): Vector | undefined {
        const t = Vector.lineSegmentsIntersectionFraction(start1, end1, start2, end2);
        if(!t){
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
    static lineSegmentsIntersectionFraction (start1: Vector, end1: Vector, start2: Vector, end2: Vector): number | undefined {
        const deltaX1 = end1.x - start1.x;
        const deltaY1 = end1.y - start1.y;
        const deltaX2 = end2.x - start2.x;
        const deltaY2 = end2.y - start2.y;

        const deltaStartX = start1.y - start2.y;
        const deltaStartY = start1.x - start2.x;
    
        const determinant = deltaX1 * deltaY2 - deltaX2 * deltaY1;
    
        let a = (deltaX1 * deltaStartX - deltaY1 * deltaStartY) / determinant;
        if (a < 0 || a > 1) return;
        let b = (deltaX2 * deltaStartX - deltaY2 * deltaStartY) / determinant;
        if (b < 0 || b > 1) return;
        return b;
    };

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
    static lerpT (vectorA: Vector, vectorB: Vector, t: number, output: Vector): Vector {
        const halfT: number = 0.5 * t;
        return Vector.add(
            vectorA.clone(Vector.prTemp[0]).scale(0.5 - halfT),
            vectorB.clone(Vector.prTemp[1]).scale(0.5 + halfT),
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
        return Vector.lerpT(vectorA, vectorB, Vector.zeroT(vectorA, vectorB), Vector.prTemp[0]).lengthSquared();
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
    static readonly temp: Vector[] = [
        new Vector(), new Vector(),
        new Vector(), new Vector(),
        new Vector(), new Vector(),
        new Vector(),
    ];

    /**
     * Private temporary vectors
     */
    private static prTemp: Vector[] = [new Vector(), new Vector()];
}