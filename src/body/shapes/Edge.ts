import { circleTest } from '../../collision/ray/CircleTest';
import { Intersection } from '../../collision/ray/Intersection';
import { Common } from '../../common/Common';
import { Vector } from '../../math/Vector';
import { Vertex } from '../../math/Vertex';
import { Settings } from '../../Settings';
import { Shape, ShapeOptions, ShapeType } from './Shape';

export interface EdgeOptions extends ShapeOptions {
    /** The first point of the shape. */
    start?: Vector;
    /** The second point of the shape. */
    end?: Vector;
    /** An initial angle of the shape */
    angle?: number;
}

/**
 * The 'Edge' is line segment. The 'Edge' is described by the two points(start and end).
 */

export class Edge<UserData = any> extends Shape {
    type: number = ShapeType.EDGE;
    /** The first point of the shape. */
    start: Vertex;
    /** The second point of the shape. */
    end: Vertex;
    /** The length of the shape. */
    length: number = 1;
    /** The normal of the shape. */
    normal: Vector = new Vector();

    constructor (options: EdgeOptions = {}, userData?: UserData) {
        super(options, userData);

        this.start = new Vertex(-0.5, 0, 0);
        this.end = new Vertex(0.5, 0, 1);
        this.length = 1;

        this.set(options.start || this.start, options.end || this.end);

        this.updateArea();

        if (options.mass) this.setMass(options.mass);
        if (!options.mass || options.density) this.setDensity(Settings.defaultDensity);

        this.updateInertia();
        if (options.angle) this.rotate(options.angle);
    }

    /**
     * Sets the 'start' and 'end' of the shape to the given.
     * @param start
     * @param end
     */
    set (start: Vector, end: Vector) {
        start.clone(this.start);
        end.clone(this.end);

        const delta = Vector.subtract(this.end, this.start, Vector.temp[0]);
        this.length = delta.length();

        delta.divideOut(this.length, this.normal);
        this.normal.rotate90();

        Vector.interpolate(this.start, this.end, 0.5, this.position);
    }

    /**
     * Returns index of the farthest vertex of convex in the given direction.
     * @param vector
     * @returns Index of the farthest vertex of convex in the given direction
     */
    project (vector: Vector) {
        return Number(Vector.dot(this.start, vector) < Vector.dot(this.end, vector));
    }

    /**
     * Translates the shape by the given vector.
     * @param vector
     */
    translate (vector: Vector) {
        this.position.add(vector);
        this.start.add(vector);
        this.end.add(vector);
    }

    /**
     * Rotates the shape by the given angle.
     * @param angle
     */
    rotate (angle: number) {
        const delta = Vector.temp[0];
        Vector.subtract(this.position, this.start, delta);
        delta.rotate(angle);
        Vector.subtract(this.position, delta, this.start);

        Vector.subtract(this.position, this.end, delta);
        delta.rotate(angle);
        Vector.subtract(this.position, delta, this.end);

        this.normal.rotate(angle);
    }

    /**
     * Updates the area of the shape.
     * @returns The area
     */
    updateArea () {
        this.area = 2 * this.length * this.radius + Math.pow(this.radius, 2) * Math.PI;
        return this.area;
    }

    /**
     * Updates the inertia of the shape.
     * @returns The inertia
     */
    updateInertia () {
        // https://www.efunda.com/math/areas/CircleHalf.cfm

        const width = this.length;
        const height = this.radius * 2;

        const rectArea = width * height;
        const rectInertia = rectArea * (Math.pow(width, 2) + Math.pow(height, 2)) / 12;

        // ((Math.PI / 4) - 8 / (9 * Math.PI)) * 2 = 1.0049120846903796
        const circleArea = Math.PI * Math.pow(this.radius, 2);
        const circleInertia = 1.0049120846903796 * Math.pow(this.radius, 4);

        const distSquared = Math.pow(this.length * 0.5 + (4 * this.radius) / (Common.PI3), 2);

        this.areaInertia = (rectInertia + circleInertia + circleArea * distSquared) / this.area;
        this.inertia = this.areaInertia * this.mass;
        return this.inertia;
    }

    /**
     * Updates the aabb of the shape.
     * @returns The aabb
     */
    updateAABB () {
        if (this.start.x < this.end.x) {
            this.aabb.minX= this.start.x - this.radius;
            this.aabb.maxX = this.end.x + this.radius;
        } else {
            this.aabb.minX = this.end.x - this.radius;
            this.aabb.maxX = this.start.x + this.radius;
        }
        if (this.start.y < this.end.y) {
            this.aabb.minY = this.start.y - this.radius;
            this.aabb.maxY = this.end.y + this.radius;
        } else {
            this.aabb.minY = this.end.y - this.radius;
            this.aabb.maxY = this.start.y + this.radius;
        }
        return this.aabb;
    }

    raycast (intersection: Intersection, from: Vector, to: Vector, delta: Vector) {

        const fraction = Vector.lineSegmentsIntersectionFraction(
            from,
            to,
            this.start,
            this.end,
        );

        if (fraction) {
            intersection.fraction = fraction;

            intersection.point.x = from.x + delta.x * fraction;
            intersection.point.y = from.y + delta.y * fraction;

            this.normal.scaleOut(-Common.sign(Vector.dot(this.normal, delta)), intersection.normal);

            return true;
        }
        
        return false;
    }

    raycastRadius (intersection: Intersection, from: Vector, to: Vector, delta: Vector) {

        const r = this.radius;
        const sign = -Common.sign(Vector.dot(this.normal, delta));
        const offset = this.normal.scaleOut(r * sign, Vector.temp[0]);

        const fraction1 = Vector.lineSegmentsIntersectionFraction(
            from,
            to,
            Vector.add(this.start, offset, Vector.temp[1]),
            Vector.add(this.end, offset, Vector.temp[2]),
        );

        if (fraction1) {
            intersection.fraction = fraction1;

            intersection.point.x = from.x + delta.x * fraction1;
            intersection.point.y = from.y + delta.y * fraction1;

            this.normal.scaleOut(sign, intersection.normal);

            return true;
        } else {
            
            const fraction2 = circleTest(from, delta, this.start, this.radius);
            const fraction3 = circleTest(from, delta, this.end, this.radius);

            // both equals Infinity
            if (fraction2 === fraction3) return false;

            if (fraction2 < fraction3) {
                intersection.fraction = fraction2;

                intersection.point.x = from.x + delta.x * fraction2;
                intersection.point.y = from.y + delta.y * fraction2;

                Vector.subtract(intersection.point, this.start, intersection.normal).divide(this.radius);
            } else {
                intersection.fraction = fraction3;

                intersection.point.x = from.x + delta.x * fraction3;
                intersection.point.y = from.y + delta.y * fraction3;

                Vector.subtract(intersection.point, this.end, intersection.normal).divide(this.radius);
            }
            return true;
        }
    }

    /**
     * Returns true if the shape contains the given point.
     * @param point
     * @returns True if the shape contains the given point
     */
    contains (point: Vector) {

        const v = Vector.subtract(point, this.start, Vector.temp[0]);
        const delta = Vector.subtract(this.end, this.start, Vector.temp[1]);

        if (Math.abs(Vector.dot(v, this.normal)) > this.radius) return false;

        const dot = Vector.dot(v, delta);

        if (dot < 0) return v.lengthSquared() < Math.pow(this.radius, 2);
        if (dot > Math.pow(this.length, 2)) return Vector.subtract(point, this.end, v).lengthSquared() < Math.pow(this.radius, 2);
        return true;
    }

    /**
     * Returns the point of the shape with given index.
     * @param index
     * @returns The point of the shape with given index
     */
    getPoint (index: number) {
        return index ? this.end : this.start;
    }

    /**
     * Returns the normal of the shape with the given index.
     * @param index
     * @param output
     * @returns The normal of the shape with the given index
     */
    getNormal (index: number, output: Vector) {
        return index ? this.normal.clone(output) : this.normal.negOut(output);
    }

    /**
     * Returns the farthest vertex in the given direction and its index.
     * @param vector
     */
    support (vector: Vector) {
        const index = this.project(vector);
        return index ? this.end : this.start;
    }
}