import { BodyType } from '../body/Body';
import { SleepingState } from '../body/Sleeping';
import { Vector } from '../math/Vector';
import { Joint, JointOptions, JointType } from './Joint';

interface DistJointOptions extends JointOptions {
    stiffness?: number;
    length?: number;
    minLength?: number;
}

/**
 * The dist joint keeps two points on two bodies on a fixed distance.
 * You can do dist joint more softy by setting less stiffness.
 * Stiffness must be beetwen 0 and 1.
 */

export class DistJoint<UserData = any> extends Joint {
    type: number = JointType.DIST_JOINT;
    stiffness: number;
    length: number;
    minLength: number | undefined;
    curLength: number;
    normal: Vector = new Vector();
    delta: Vector = new Vector();

    constructor (options: DistJointOptions = {}, userData?: UserData) {
        super(options, userData);
        this.stiffness = options.stiffness ?? 0.1;

        this.curLength = Vector.dist(this.getWorldPointA(), this.getWorldPointB());
        this.length = options.length ?? this.curLength;

        if (options.minLength !== undefined) {
            this.minLength = options.minLength;

            if (<number>this.minLength > this.length) {
                [this.minLength, this.length] = [this.length, <number>this.minLength];
            }
        }
    }

    preSovle () {
        this.bodyA?.setSleeping(SleepingState.AWAKE);
        this.bodyB?.setSleeping(SleepingState.AWAKE);

        const pointA = this.getWorldPointA();
        const pointB = this.getWorldPointB();

        const delta = Vector.subtract(pointA, pointB, this.delta);
        const dist = this.curLength = delta.length();

        dist ? delta.divideOut(dist, this.normal) : this.normal.set(0, 1);
    }

    warmStart () {
        const bodyA = this.bodyA;
        const bodyB = this.bodyB;

        const impulse = this.normal.scaleOut(this.impulse, new Vector());

        if (bodyA && bodyA.type === BodyType.dynamic && bodyA.sleepState !== SleepingState.SLEEPING) {
            bodyA.velocity.x -= impulse.x * bodyA.inverseMass;
            bodyA.velocity.y -= impulse.y * bodyA.inverseMass;
            bodyA.angularVelocity -= (this.offsetA.x * impulse.y - this.offsetA.y * impulse.x) * bodyA.inverseInertia;
        }
        if (bodyB && bodyB.type === BodyType.dynamic && bodyB.sleepState !== SleepingState.SLEEPING) {
            bodyB.velocity.x += impulse.x * bodyB.inverseMass;
            bodyB.velocity.y += impulse.y * bodyB.inverseMass;
            bodyB.angularVelocity += (this.offsetB.x * impulse.y - this.offsetB.y * impulse.x) * bodyB.inverseInertia;
        }

        this.impulse *= 0.8;
    }

    solve () {
        const bodyA = this.bodyA;
        const bodyB = this.bodyB;

        const relativeVelocity = new Vector().set(
            (bodyB ? (bodyB.velocity.x - this.offsetB.y * bodyB.angularVelocity) : 0) - (bodyA ? (bodyA.velocity.x - this.offsetA.y * bodyA.angularVelocity) : 0),
            (bodyB ? (bodyB.velocity.y + this.offsetB.x * bodyB.angularVelocity) : 0) - (bodyA ? (bodyA.velocity.y + this.offsetA.x * bodyA.angularVelocity) : 0),
        );
        const normalVelocity = Vector.dot(this.normal, relativeVelocity);

        const delta = Vector.subtract(this.delta, relativeVelocity, Joint.vecTemp[0]);

        const dist = delta.length();

        if (this.minLength !== undefined && dist > this.minLength && dist < this.length) {
            this.impulse = 0;
            return;
        }
        const diff = (this.minLength !== undefined && dist < this.minLength) ? (dist - this.minLength) : (dist - this.length);

        const normal = dist ? delta.divideOut(dist, this.normal) : this.normal.set(0, 1);

        const normalCrossA = Vector.cross(this.offsetA, normal);
        const normalCrossB = Vector.cross(this.offsetB, normal);
        this.share = 1 / (
            (bodyA ? (bodyA.inverseMass + bodyA.inverseInertia * normalCrossA * normalCrossA) : 0) +
            (bodyB ? (bodyB.inverseMass + bodyB.inverseInertia * normalCrossB * normalCrossB) : 0)
        );

        const normalImpulse = (diff - normalVelocity) * 0.5 * this.share * this.stiffness;
        this.impulse += normalImpulse * 0.1;

        const impulse = this.normal.scaleOut(normalImpulse, new Vector());

        if (bodyA && bodyA.type === BodyType.dynamic && bodyA.sleepState !== SleepingState.SLEEPING) {
            bodyA.velocity.x -= impulse.x * bodyA.inverseMass;
            bodyA.velocity.y -= impulse.y * bodyA.inverseMass;
            bodyA.angularVelocity -= (this.offsetA.x * impulse.y - this.offsetA.y * impulse.x) * bodyA.inverseInertia;
        }
        if (bodyB && bodyB.type === BodyType.dynamic && bodyB.sleepState !== SleepingState.SLEEPING) {
            bodyB.velocity.x += impulse.x * bodyB.inverseMass;
            bodyB.velocity.y += impulse.y * bodyB.inverseMass;
            bodyB.angularVelocity += (this.offsetB.x * impulse.y - this.offsetB.y * impulse.x) * bodyB.inverseInertia;
        }
    }
}