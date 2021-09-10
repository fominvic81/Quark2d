import { Vector } from '../math/Vector';
import { Common } from '../common/Common';
import { Body } from '../body/Body';

export enum JointType {
    DIST_JOINT = Math.pow(2, 0),
}

export interface JointOptions {
    bodyA?: Body;
    bodyB?: Body;
    pointA?: Vector;
    pointB?: Vector;
    worldPointA?: Vector;
    worldPointB?: Vector;
}

/**
 * Joints are used to connect bodies to each other or to fixed world position.
 */

export abstract class Joint<UserData = any> {
    id: number = Common.nextId();
    type: JointType = 0;
    bodyA?: Body;
    bodyB?: Body;
    pointA: Vector = new Vector();
    pointB: Vector = new Vector();
    worldPointA: Vector = new Vector();
    worldPointB: Vector = new Vector();
    offsetA: Vector;
    offsetB: Vector;
    impulse: number = 0;
    userData?: UserData;

    protected static vecTemp = [
        new Vector(), new Vector(),
        new Vector(), new Vector(),
        new Vector(), new Vector(),
        new Vector(),
    ];

    constructor (options: JointOptions = {}, userData?: UserData) {

        this.setBodyA(options.bodyA);
        this.setBodyB(options.bodyB);
        if (options.pointA) {
            this.setPointA(options.pointA);
        } else if (options.worldPointA) {
            this.setWorldPointA(options.worldPointA);
        }
        if (options.pointB) {
            this.setPointB(options.pointB);
        } else if (options.worldPointB) {
            this.setWorldPointB(options.worldPointB);
        }
        this.offsetA = new Vector();
        this.offsetB = new Vector();
        this.userData = userData;
    }

    abstract preSovle (): void;

    abstract warmStart(): void;

    abstract solve (): void;

    setPointA (point: Vector) {
        point.clone(this.pointA);
        if (this.bodyA) {
            this.pointA.rotate(-this.bodyA.angle);
        }
    }

    setPointB (point: Vector) {
        point.clone(this.pointB);
        if (this.bodyB) {
            this.pointB.rotate(-this.bodyB.angle);
        }
    }

    setWorldPointA (point: Vector) {
        this.setPointA(Vector.subtract(point, this.bodyA ? this.bodyA.position : Vector.zero, Joint.vecTemp[0]));
    }
    
    setWorldPointB (point: Vector) {
        this.setPointB(Vector.subtract(point, this.bodyB ? this.bodyB.position : Vector.zero, Joint.vecTemp[0]));
    }

    /**
     * Sets joint.bodyA to the given body. Body can be undefined.
     * @param body
     */
    setBodyA (body?: Body) {
        this.impulse = 0;
        if (this.bodyA) {
            this.bodyA.joints.delete(this);
            this.bodyA = undefined;
        }
        if (body) {
            this.bodyA = body;
            body.joints.add(this);
        }
    }

    /**
     * Sets joint.bodyB to the given body. Body can be undefined.
     * @param body
     */
    setBodyB (body?: Body) {
        this.impulse = 0;
        if (this.bodyB) {
            this.bodyB.joints.delete(this);
            this.bodyB = undefined;
        }
        if (body) {
            this.bodyB = body;
            body.joints.add(this);
        }
    }

    /**
     * Returns the world-space position of 'pointA'.
     * @returns The world-space position of 'pointA'
     */
    getWorldPointA () {
        if (this.bodyA) {
            this.offsetA.x = this.pointA.x * this.bodyA.dir.x - this.pointA.y * this.bodyA.dir.y;
            this.offsetA.y = this.pointA.x * this.bodyA.dir.y + this.pointA.y * this.bodyA.dir.x;
            Vector.add(this.bodyA.center, this.offsetA, this.worldPointA);
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
            this.offsetB.x = this.pointB.x * this.bodyB.dir.x - this.pointB.y * this.bodyB.dir.y;
            this.offsetB.y = this.pointB.x * this.bodyB.dir.y + this.pointB.y * this.bodyB.dir.x;
            Vector.add(this.bodyB.center, this.offsetB, this.worldPointB);
        } else {
            this.pointB.clone(this.worldPointB);
        }
        return this.worldPointB;
    }

}