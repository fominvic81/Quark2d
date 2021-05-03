import { Intersection } from '../../collision/ray/Intersection';
import { Common } from '../../common/Common';
import { Vector } from '../../math/Vector';
import { Vertex } from '../../math/Vertex';
import { Shape, ShapeOptions, ShapeType } from './Shape';

export interface EdgeOptions extends ShapeOptions {
    start?: Vector;
    end?: Vector;
}

/**
 * The 'Edge' is line segment. The 'Edge' is described by the two points(start and end).
 */

export class Edge<UserData = any> extends Shape {
    type: number = ShapeType.EDGE;
    start: Vertex;
    end: Vertex;
    length: number = 1;
    delta: Vector = new Vector();
    normal: Vector = new Vector();
    ngNormal: Vector = new Vector();

    constructor (options: EdgeOptions = {}, userData?: UserData) {
        super(options, userData);

        this.start = new Vertex(-0.5, 0, 0);
        this.end = new Vertex(0.5, 0, 1);
        this.length = 1;
        this.delta = new Vector();
        this.normal = new Vector();
        this.ngNormal = new Vector();

        this.set(options.start || this.start, options.end || this.end);

        this.updateArea();
        this.updateInertia();
    }

    /**
     * Sets the 'start' and 'end' of the shape to the given.
     * @param start
     * @param end
     */
    set (start: Vector, end: Vector) {
        start.clone(this.start);
        end.clone(this.end);

        Vector.subtract(this.end, this.start, this.delta);
        this.length = this.delta.length();

        this.delta.divide(this.length, this.normal);
        this.normal.rotate90();

        Vector.interpolate(this.start, this.end, 0.5, this.position);

        this.normal.neg(this.ngNormal);
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
        this.normal.neg(this.ngNormal);
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
        this.inertia = 0;

        // https://www.efunda.com/math/areas/CircleHalf.cfm

        const width = this.length;
        const height = this.radius * 2;

        const rectArea = width * height;
        const rectInertia = rectArea * (Math.pow(width, 2) + Math.pow(height, 2)) / 12;

        // ((Math.PI / 4) - 8 / (9 * Math.PI)) * 2 = 1.0049120846903796
        const circleArea = Math.PI * Math.pow(this.radius, 2);
        const circleInertia = 1.0049120846903796 * Math.pow(this.radius, 4);

        const distSquared = Math.pow(this.length * 0.5 + (4 * this.radius) / (Common.PI3), 2);

        this.inertia = (rectInertia + circleInertia + circleArea * distSquared) / this.area;

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

        const contact = intersection.contacts[0];

        const point = Vector.lineLineIntersection(this.start, this.end, from, to, contact.point);
        if (point) {

            this.normal.clone(contact.normal);
            if (Vector.dot(delta, contact.normal) > 0) {
                contact.normal.neg();
            }
            ++intersection.contactsCount;

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
        return (index ? this.normal : this.ngNormal).clone(output);
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