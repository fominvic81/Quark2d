import { Vector } from '../math/Vector';
import { Common } from '../common/Common';
import { Body } from '../body/Body';

export enum ConstraintType {
    DISTANCE_CONSTRAINT = Math.pow(2, 0),
    ANGLE_CONSTRAINT = Math.pow(2, 1),
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

    protected static vecTemp = [
        new Vector(), new Vector(),
        new Vector(), new Vector(),
        new Vector(), new Vector(),
        new Vector(),
    ];

    constructor (options: ConstraintOptions = {}) {

        this.bodyA = options.bodyA;
        this.bodyB = options.bodyB;
        this.pointA = options.pointA ? options.pointA.clone() : new Vector();
        this.pointB = options.pointB ? options.pointB.clone() : new Vector();
        this.worldPointA = this.bodyA ? new Vector() : this.pointA.clone();
        this.worldPointB = this.bodyB ? new Vector() : this.pointB.clone();
    }

    /**
     * Solves a constraint.
     */
    abstract solve (): void;

    /**
     * Returns the world-space position of 'pointA'.
     * @returns The world-space position of 'pointA'
     */
    getWorldPointA () {
        if (this.bodyA) {
            this.worldPointA.x = this.pointA.x * this.bodyA.constraintDir.x - this.pointA.y * this.bodyA.constraintDir.y;
            this.worldPointA.y = this.pointA.x * this.bodyA.constraintDir.y + this.pointA.y * this.bodyA.constraintDir.x;
            Vector.add(this.worldPointA, this.bodyA.position);
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
            this.worldPointB.x = this.pointB.x * this.bodyB.constraintDir.x - this.pointB.y * this.bodyB.constraintDir.y;
            this.worldPointB.y = this.pointB.x * this.bodyB.constraintDir.y + this.pointB.y * this.bodyB.constraintDir.x;
            Vector.add(this.worldPointB, this.bodyB.position);
        } else {
            this.pointB.clone(this.worldPointB);
        }
        return this.worldPointB;
    }

}