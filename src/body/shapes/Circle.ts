import { Shape, ShapeOptions, ShapeType } from './Shape';
import { Vector } from '../../math/Vector';
import { Solver } from '../../collision/solver/Solver';
import { Intersection } from '../../collision/ray/Intersection';
import { Vertex } from '../../math/Vertex';

export interface CircleOptions extends ShapeOptions {}

export class Circle<UserData = any> extends Shape {
    type: number = ShapeType.CIRCLE;
    position: Vertex = new Vertex(0, 0, 0);

    constructor (options: CircleOptions = {}, userData?: UserData) {
        super(options, userData);

        this.radius = (options.radius ?? 0.5) + Solver.SLOP * 2;

        this.updateArea();
        this.inertia = this.updateInertia();
    }

    /**
     * Translates the shape by the given vector.
     * @param vector
     */
    translate (vector: Vector) {
        this.position.add(vector);
    }

    /**
     * Shape hasn't method 'rotate'. 
     */
    rotate () {}

    /**
     * Updates the area of the shape.
     * @returns The area
     */
    updateArea () {
        this.area = Math.PI * Math.pow(this.radius, 2);
        return this.area;
    }

    /**
     * Updates the inertia of the shape.
     * @returns The inertia
     */
    updateInertia () {
        this.inertia = Math.pow(this.radius, 2) / 2;
        return this.inertia;
    }

    /**
     * Updates the aabb of the shape.
     * @returns The aabb
     */
    updateAABB () {
        this.aabb.setNum(-this.radius, -this.radius, this.radius, this.radius);
        this.aabb.translate(this.position);
        return this.aabb;
    }

    raycast (intersection: Intersection, from: Vector, to: Vector, delta: Vector) {

        const position = this.position;
        const radius = this.radius;

        const posDelta = Vector.subtract(from, position, Vector.temp[0]);

        const a = delta.lengthSquared();
        const b = 2 * Vector.dot(delta, posDelta);
        const c = posDelta.lengthSquared() - Math.pow(radius, 2);
        const d = Math.pow(b, 2) - 4 * a * c;

        if (d < 0) {
            return intersection;
        }
        if (d === 0) { // one intersection
            // TODO
            return intersection;
        }
        const dSqrt = Math.sqrt(d);
        const inverse2a = 1 / (2 * a);
        const p1 = (-b - dSqrt) * inverse2a;
        const p2 = (dSqrt - b) * inverse2a;

        if (p1 >= 0 && p1 <= 1) {
            const contact = intersection.contacts[intersection.contactsCount];
            ++intersection.contactsCount;

            Vector.interpolate(from, to, p1, contact.point);
            
            Vector.subtract(contact.point, position, contact.normal);
            contact.normal.divide(radius);
        }

        if (p2 >= 0 && p2 <= 1) {
            const contact = intersection.contacts[intersection.contactsCount];
            ++intersection.contactsCount;

            Vector.interpolate(from, to, p2, contact.point);
            
            Vector.subtract(position, contact.point, contact.normal);
            contact.normal.divide(radius);
        }
    }

    /**
     * Returns true if the shape contains the given point.
     * @param point
     * @returns True if the shape contains the given point
     */
    contains (point: Vector) {
        return Vector.distSquared(this.position, point) < Math.pow(this.radius, 2);
    }

    /**
     * Returns position of the shape.
     * @param index
     * @returns Position of the shape
     */
    getPoint (index: number) {
        return this.position;
    }

    /**
     * Returns vector(1, 0).
     * @param index
     * @param output
     * @returns vector(1, 0)
     */
    getNormal (index: number, output: Vector) {
        return output.set(1, 0);
    }

    /**
     * Returns the farthest vertex in the given direction and its index.
     * @param vector
     */
     support (vector: Vector) {
        return this.position;
    }
}