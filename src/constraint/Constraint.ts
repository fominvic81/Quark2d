import { Vector } from '../math/Vector';
import { Common } from '../common/Common';
import { Body } from '../body/Body';

export enum ConstraintType {
    DISTANCE_CONSTRAINT = Math.pow(2, 0),
    Point_CONSTRAINT = Math.pow(2, 1),
}

export interface ConstraintOptions {
    bodyA?: Body;
    bodyB?: Body;
    pointA?: Vector;
    pointB?: Vector;
}

/**
 * Constraints are used to constrain bodies to each other or to fixed world position.
 */

export abstract class Constraint {
    id: number = Common.nextId();
    name: string = 'constraint';
    type: ConstraintType = 0;
    bodyA?: Body;
    bodyB?: Body;
    pointA: Vector;
    pointB: Vector;
    worldPointA: Vector;
    worldPointB: Vector;
    offsetA: Vector;
    offsetB: Vector;

    protected static vecTemp = [
        new Vector(), new Vector(),
        new Vector(), new Vector(),
        new Vector(), new Vector(),
        new Vector(),
    ];

    constructor (options: ConstraintOptions = {}) {

        this.setBodyA(options.bodyA);
        this.setBodyB(options.bodyB);
        this.bodyA?.dir.clone(this.bodyA.constraintDir);
        this.bodyB?.dir.clone(this.bodyB.constraintDir);
        if (this.bodyA) this.bodyA.constraintAngle = this.bodyA.angle;
        if (this.bodyB) this.bodyB.constraintAngle = this.bodyB.angle;
        this.pointA = options.pointA ? options.pointA.clone() : new Vector();
        this.pointB = options.pointB ? options.pointB.clone() : new Vector();
        this.worldPointA = this.bodyA ? new Vector() : this.pointA.clone();
        this.worldPointB = this.bodyB ? new Vector() : this.pointB.clone();
        this.offsetA = new Vector();
        this.offsetB = new Vector();
    }

    /**
     * Solves a constraint.
     */
    abstract solve (): void;


    /**
     * Sets constraint.bodyA to the given body. Body can be undefined.
     * @param body
     */
    setBodyA (body?: Body) {
        if (this.bodyA) {
            this.bodyA.constraints.delete(this);
            this.bodyA = undefined;
        }
        if (body) {
            this.bodyA = body;
            body.constraints.add(this);
        }
    }

    /**
     * Sets constraint.bodyB to the given body. Body can be undefined.
     * @param body
     */
    setBodyB (body?: Body) {
        if (this.bodyB) {
            this.bodyB.constraints.delete(this);
            this.bodyB = undefined;
        }
        if (body) {
            this.bodyB = body;
            body.constraints.add(this);
        }
    }

    /**
     * Returns the world-space position of 'pointA'.
     * @returns The world-space position of 'pointA'
     */
    getWorldPointA () {
        if (this.bodyA) {
            this.offsetA.x = this.pointA.x * this.bodyA.constraintDir.x - this.pointA.y * this.bodyA.constraintDir.y;
            this.offsetA.y = this.pointA.x * this.bodyA.constraintDir.y + this.pointA.y * this.bodyA.constraintDir.x;
            Vector.add(this.bodyA.position, this.offsetA, this.worldPointA);
        } else {
            this.pointA.clone(this.worldPointA);
        }
        return this.worldPointA;
    }

    /**
     * Returns the world-space position of 'pointB'.
     * @returns The world-space position of 'pointB'
     */
    getWorldPointB () {
        if (this.bodyB) {
            this.offsetB.x = this.pointB.x * this.bodyB.constraintDir.x - this.pointB.y * this.bodyB.constraintDir.y;
            this.offsetB.y = this.pointB.x * this.bodyB.constraintDir.y + this.pointB.y * this.bodyB.constraintDir.x;
            Vector.add(this.bodyB.position, this.offsetB, this.worldPointB);
        } else {
            this.pointB.clone(this.worldPointB);
        }
        return this.worldPointB;
    }

}