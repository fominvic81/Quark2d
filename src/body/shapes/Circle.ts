import { Shape, ShapeOptions, ShapeType } from './Shape';
import { Vector } from '../../math/Vector';
import { Intersection } from '../../collision/ray/Intersection';
import { Vertex } from '../../math/Vertex';
import { Settings } from '../../Settings';
import { circleTest } from '../../collision/ray/CircleTest';

export interface CircleOptions extends ShapeOptions {}

export class Circle<UserData = any> extends Shape {
    type: number = ShapeType.CIRCLE;
    position: Vertex = new Vertex(0, 0, 0);

    constructor (options: CircleOptions = {}, userData?: UserData) {
        super(options, userData);

        this.radius = (options.radius ?? 0.5) + Settings.defaultRadius;

        this.updateArea();
        
        if (options.mass) this.setMass(options.mass);
        if (!options.mass || options.density) this.setDensity(options.density ?? Settings.defaultDensity);

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
        this.areaInertia = Math.pow(this.radius, 2) / 2;
        this.inertia = this.areaInertia * this.mass;
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
        return this.raycastRadius(intersection, from, to, delta);
    }

    raycastRadius (intersection: Intersection, from: Vector, to: Vector, delta: Vector) {
        const fraction = circleTest(from, delta, this.position, this.radius);
        if (fraction === Infinity) return false;

        intersection.fraction = fraction;
        
        intersection.point.x = from.x + delta.x * fraction;
        intersection.point.y = from.y + delta.y * fraction;

        Vector.subtract(intersection.point, this.position, intersection.normal).divide(this.radius);

        return true;
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