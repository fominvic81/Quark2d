import { Vector } from '../../math/Vector';
import { AABB } from '../../math/AABB';
import { Common } from '../../common/Common';
import { Filter } from '../Filter';
import { AABBTreeNode } from '../../collision/manager/broadphase/AABBTree';
import { Body } from '../Body';
import { Intersection } from '../../collision/ray/Intersection';
import { Vertex } from '../../math/Vertex';
import { Settings } from '../../Settings';

export interface ShapeOptions {
    /** The density of the shape. */
    density?: number;
    /** The mass of the shape. */
    mass?: number;
    /** A rounding radius of the shape(radius of circle, radius of capsule, ...). */
    radius?: number;
    /** A collision filter of the shape */
    filter?: {
        category?: number,
        mask?: number,
        group?: number,
    };
    /**
     * The restitution(elasticity) of the shape. Must be in range 0...1.
     * A value of 0 means that the body will not bounce at all.
     * A value of 1 means that the body may bounce with 100% of its kinetic energy.
     */
    restitution?: number;
    /** The friction of shape. Must be in range 0...Infinity. */
    friction?: number;
    /** The surface velocity of the shape. Useful for creating conveyor belts. */
    surfaceVelocity?: number;
    /**
     * A flag that indicates whether a body is a sensor.
     * Sensors does not react with other bodies but triggers collision events.
     */
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
    /** An id of the body */
    id: number = Common.nextId();
    /** A type of the shape. */
    abstract type: number;
    /** A body to which the shape is attached. */
    body: undefined | Body;
    /** Current center of mass of the shape. */
    center: Vector = new Vector();
    /** The axis-aligned bounding box of the shape. */
    aabb: AABB = new AABB();
    /** The area of the shape. */
    area: number = 0;
    /** The density of the shape. */
    density: number = Settings.defaultDensity;
    /** The mass of the shape. */
    mass: number = 0;
    /** The moment of inertia of the shape. */
    inertia: number = 0;
    /** @ignore */
    areaInertia: number = 0;
    /** A rounding radius of the shape(radius of circle, radius of capsule, ...). */
    radius: number;
    /** A collision filter of the shape */
    filter: Filter = new Filter();
    /**
     * The restitution(elasticity) of the shape. Must be in range 0...1.
     * A value of 0 means that the body will not bounce at all.
     * A value of 1 means that the body may bounce with 100% of its kinetic energy.
     */
    restitution: number;
    /** The friction of shape. Must be in range 0...Infinity. */
    friction: number;
    /** The surface velocity of the shape. Useful for creating conveyor belts. */
    surfaceVelocity: number;
    /**
     * A flag that indicates whether a body is a sensor.
     * Sensors does not react with other bodies but triggers collision events.
     */
    isSensor: boolean;
    /** @ignore */
    AABBTreeNode: AABBTreeNode = new AABBTreeNode();
    /** A variable that contains user data */
    userData?: UserData;

    constructor (options: ShapeOptions = {}, userData?: UserData) {
        this.radius = options.radius ?? Settings.defaultRadius;
        if (options.filter) {
            this.filter.category = options.filter.category ?? this.filter.category;
            this.filter.mask = options.filter.mask ?? this.filter.mask;
            this.filter.group = options.filter.group ?? this.filter.group;
        }
        this.restitution = options.restitution ?? Settings.defaultRestitution;
        this.friction = options.friction ?? Settings.defaultFriction;
        this.surfaceVelocity = options.surfaceVelocity ?? 0;
        this.isSensor = options.isSensor ?? false;

        this.AABBTreeNode.shape = this;

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

    abstract rotateU (uX: number, uY: number): void;

    abstract rotateAbout (angle: number, point: Vector): void;

    abstract rotateAboutU (uX: number, uY: number, point: Vector): void;

    /**
     * Updates the area of the shape.
     */
    abstract updateArea (): number;

    /**
     * Updates the inertia of the shape.
     */
    abstract updateInertia (): number;

    setMass (mass: number) {
        this.setDensity(mass/this.area);
    }

    setDensity (density: number) {
        this.density = density;
        this.mass = this.density * this.area;
        this.inertia = this.mass * this.areaInertia;
        this.body?.updateMass()
        this.body?.updateInertia()
    }

    /**
     * Updates the aabb of the shape.
     */
    abstract updateAABB (): AABB;

    abstract raycast (intersection: Intersection, from: Vector, to: Vector, delta: Vector): boolean;

    abstract raycastRadius (intersection: Intersection, from: Vector, to: Vector, delta: Vector): boolean;

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

    abstract getCenterOfMass (output: Vector): Vector;
}