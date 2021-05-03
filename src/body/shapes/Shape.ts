import { Vector } from '../../math/Vector';
import { AABB } from '../../math/AABB';
import { Common } from '../../common/Common';
import { Filter } from '../Filter';
import { Solver } from '../../collision/solver/Solver';
import { Region } from '../../collision/phase/Broadphase';
import { Body } from '../Body';
import { Intersection } from '../../collision/ray/Intersection';
import { Vertex } from '../../math/Vertex';

export interface ShapeOptions {
    radius?: number;
    filter?: {
        category?: number,
        mask?: number,
        group?: number,
    },
    restitution?: number;
    friction?: number;
    surfaceVelocity?: number;
    isSensor?: boolean;
}

export enum ShapeType {
    CIRCLE = Math.pow(2, 0),
    CONVEX = Math.pow(2, 1),
    EDGE = Math.pow(2, 2),
}

/**
 * The shapes describe geometry of the body, you can add many shapes to the body.
 */

export abstract class Shape<UserData = any> {
    id: number = Common.nextId();
    name: string = 'shape';
    type: number = 0;
    body: undefined | Body;
    position: Vector = new Vector();
    aabb: AABB = new AABB();
    inertia: number = 0;
    area: number = 0;
    radius: number;
    filter: Filter = new Filter();
    restitution: number;
    friction: number;
    surfaceVelocity: number;
    isSensor: boolean;
    region: Region = new Region();
    userData?: UserData;

    constructor (options: ShapeOptions = {}, userData?: UserData) {
        this.radius = options.radius ?? Solver.SLOP * 2;
        if (options.filter) {
            this.filter.category = options.filter.category ?? this.filter.category;
            this.filter.mask = options.filter.mask ?? this.filter.category;
            this.filter.group = options.filter.group ?? this.filter.group;
        }
        this.restitution = options.restitution ?? 0.1;
        this.friction = options.friction ?? 0.4;
        this.surfaceVelocity = options.surfaceVelocity ?? 0;
        this.isSensor = options.isSensor ?? false;

        this.userData = userData;
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

    /**
     * Returns the farthest vertex in the given direction and its index.
     * @param vector
     */
    abstract support (vector: Vector): Vertex;
}