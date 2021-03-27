import { Vector } from '../math/Vector';
import { Common } from '../common/Common';

export class Constraint {

    constructor (options = {}) {

        this.id = Common.nextId();
        this.name = 'constraint';
        this.bodyA = options.bodyA;
        this.bodyB = options.bodyB;
        this.pointA = options.pointA ? options.pointA.clone() : new Vector();
        this.pointB = options.pointB ? options.pointB.clone() : new Vector();
        this.worldPointA = this.bodyA ? new Vector() : this.pointA.clone();
        this.worldPointB = this.bodyB ? new Vector() : this.pointB.clone();
    }

    solve () {}

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

Constraint.vecTemp = [
    new Vector(), new Vector(),
    new Vector(), new Vector(),
    new Vector(), new Vector(),
    new Vector(),
];

Constraint.DISTANCE_CONSTRAINT = Math.pow(2, 0);
Constraint.ANGLE_CONSTRAINT = Math.pow(2, 1);