import { Vector } from '../../math/Vector';
import { AABB } from '../../math/AABB';
import { Common } from '../../common/Common';
import { Filter } from '../Filter';
import { Solver } from '../../collision/solver/Solver';
import { Region } from '../../collision/phase/Broadphase';
import { Body } from '../Body';
import { Intersection } from '../../collision/ray/Intersection';

export interface ShapeOptions {
    inertia?: number;
    radius?: number;
    filter?: {
        category?: number,
        mask?: number,
        group?: number,
    },
    restitution?: number;
    friction?: number;
    surfaceVelocity?: number;
}

export enum ShapeType {
    CIRCLE = Math.pow(2, 0),
    CONVEX = Math.pow(2, 1),
    EDGE = Math.pow(2, 2),
}

/**
 * The shapes describe geometry of the body, you can add many shapes to the body.
 */

export abstract class Shape {
    id: number = Common.nextId();
    name: string = 'shape';
    type: number = 0;
    body: undefined | Body;
    position: Vector = new Vector();
    aabb: AABB = new AABB();
    inertia: number;
    area: number = 0;
    radius: number;
    filter: Filter = new Filter();
    restitution: number;
    friction: number;
    surfaceVelocity: number;
    region?: Region;

    constructor (options: ShapeOptions = {}) {
        this.inertia = options.inertia ?? 0;
        this.radius = options.radius ?? Solver.SLOP * 2;
        if (options.filter) {
            if (options.filter.category !== undefined) this.filter.category = options.filter.category;
            if (options.filter.mask !== undefined) this.filter.mask = options.filter.mask;
            if (options.filter.group !== undefined) this.filter.group = options.filter.group;
        }
        this.restitution = options.restitution !== undefined ? options.restitution : 0.1;
        this.friction = options.friction !== undefined ? options.friction : 0.4;
        this.surfaceVelocity = options.surfaceVelocity !== undefined ? options.surfaceVelocity : 0;
    }

    /**
     * Translates the shape by the given vector.
     * @param vector
     */
    abstract translate (vector: Vector): void;

    /**
     * Rotates the shape by the given angle.
     * @param angle
     */
    abstract rotate (angle: number): void;

    /**
     * Updates the area of the shape.
     */
    abstract updateArea (): number;

    /**
     * Updates the inertia of the shape.
     */
    abstract updateInertia (): number;

    /**
     * Updates the aabb of the shape.
     */
    abstract updateAABB (): AABB;

    abstract raycast (intersection: Intersection, from: Vector, to: Vector, delta: Vector): void;

    /**
     * Returns true if the shape contains the given point.
     * @param point
     */
    abstract contains (point: Vector): boolean;

    /**
     * Returns the point of the shape with the given index.
     * @param index
     */
    abstract getPoint (index: number): Vector;

    /**
     * Returns the normal of the shape with the given index.
     * @param index
     * @param output
     */
    abstract getNormal (index: number, output: Vector): Vector;

}